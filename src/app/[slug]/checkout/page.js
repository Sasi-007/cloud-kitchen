'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function SlugCheckoutPage({ params }) {
  const { slug }  = params;
  const router    = useRouter();
  const [kitchen, setKitchen]   = useState(null);
  const [kitchenLoading, setKitchenLoading] = useState(true);
  const [kitchenError, setKitchenError] = useState('');
  const [cart,    setCart]      = useState({});
  const [payment, setPayment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '', delivery_date: '', delivery_time: '' });

  // Generate time slots: 10am–9pm in 1hr intervals
  const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
    const h = i + 10;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    return label;
  });

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadCheckout() {
      setKitchenLoading(true);
      setKitchenError('');

      const { data, error } = await getSupabase()
        .from('kitchens')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Kitchen lookup failed:', error);
        setKitchenError(error.message || 'Kitchen lookup failed');
        setKitchen(null);
      } else if (!data) {
        setKitchenError('Kitchen not found');
        setKitchen(null);
      } else {
        setKitchen({ ...data, plan: data.plan || 'starter' });
      }

      setKitchenLoading(false);
    }

    loadCheckout();
    try { setCart(JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}')); } catch {}
  }, [slug]);

  const items    = Object.values(cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 1000 ? 0 : 50;
  const total    = subtotal + delivery;
  const canAcceptGpay = Boolean(kitchen?.upi_id);

  function field(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  function isMissingScheduleColumn(error) {
    const msg = `${error?.message || ''} ${error?.details || ''}`;
    return msg.includes('delivery_date') || msg.includes('delivery_time');
  }

  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) { alert('Please fill all required fields'); return; }
    if (!payment) { alert('Please select a payment method'); return; }
    if (!items.length) { alert('Your cart is empty. Add items before confirming the order.'); return; }
    if (kitchenLoading) { alert('Kitchen data is still loading. Please wait a moment and try again.'); return; }
    if (!kitchen) { alert(kitchenError || 'Kitchen not found. Please go back to the menu and try again.'); return; }
    setLoading(true);

    // UUID-based order ID — unguessable, safe to use as tracking token
    const id = 'SF-' + (crypto?.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase() : Math.random().toString(36).slice(2, 12).toUpperCase());
    const order = {
      id,
      kitchen_id:     kitchen.id,
      customer_name:  form.name,
      customer_phone: form.phone,
      address:        form.address,
      note:           form.note,
      delivery_date:  form.delivery_date || null,
      delivery_time:  form.delivery_time || null,
      items:          items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️' })),
      total,
      payment_method: payment,
      status:         'new',
    };

    const supabase = getSupabase();
    let { error } = await supabase.from('orders').insert(order);

    if (error && isMissingScheduleColumn(error)) {
      const { delivery_date, delivery_time, ...orderWithoutSchedule } = order;
      ({ error } = await supabase.from('orders').insert(orderWithoutSchedule));
    }

    if (error) {
      console.error('Order insert failed:', error);
      alert(error.message ? `Failed to place order: ${error.message}` : 'Failed to place order. Please try again.');
      setLoading(false);
      return;
    }

    localStorage.removeItem(`ck_cart_${slug}`);
    window.dispatchEvent(new Event('cart-updated'));
    router.push(`/${slug}/order/${id}`);
  }

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="section-title">📋 Place Order</div>
      <div className="info-box">⚠️ Orders are prepared in bulk. Please confirm party count before proceeding.</div>
      {kitchenError && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 14px', color: 'var(--red)', fontSize: '0.88rem', fontWeight: 600, marginBottom: 14 }}>
          {kitchenError}
        </div>
      )}

      <div className="form-group"><label>YOUR NAME</label>
        <input name="name" value={form.name} onChange={field} placeholder="Ravi Kumar" required />
      </div>
      <div className="form-group"><label>PHONE (WhatsApp)</label>
        <input name="phone" value={form.phone} onChange={field} placeholder="+91 98765 43210" type="tel" required />
      </div>
      <div className="form-group"><label>DELIVERY ADDRESS</label>
        <textarea name="address" value={form.address} onChange={field} rows={2} placeholder="Plot 12, HITEC City, Hyderabad…" required />
      </div>
      <div className="form-group"><label>SPECIAL INSTRUCTIONS (optional)</label>
        <input name="note" value={form.note} onChange={field} placeholder="No onion, extra spicy…" />
      </div>

      <div className="divider" />
      <div style={{ fontWeight: 700, marginBottom: 4 }}>🗓️ Delivery Schedule</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 12 }}>Leave blank for earliest delivery, or pick a preferred date &amp; time.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div className="form-group">
          <label>DELIVERY DATE</label>
          <input name="delivery_date" type="date" value={form.delivery_date} onChange={field} min={today} />
        </div>
        <div className="form-group">
          <label>PREFERRED TIME</label>
          <select name="delivery_time" value={form.delivery_time} onChange={field} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem', background: '#fff' }}>
            <option value="">Any time</option>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="divider" />
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Select Payment Method</div>
      <div className="payment-options">
        <div className={`pay-opt ${payment === 'cod' ? 'selected' : ''}`} onClick={() => setPayment('cod')}>
          <div className="pay-icon">💵</div><h4>Cash on Delivery</h4><p>Pay when food arrives</p>
        </div>
        {canAcceptGpay && (
          <div className={`pay-opt ${payment === 'gpay' ? 'selected' : ''}`} onClick={() => setPayment('gpay')}>
            <div className="pay-icon">📱</div><h4>GPay / UPI</h4><p>Scan &amp; pay instantly</p>
          </div>
        )}
      </div>

      {/* Advance payment option — available for all plans */}
      {payment === 'cod' && total > 1000 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '14px 16px', marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>💰 Want to pay an advance?</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 10 }}>
            Pay a partial amount now via GPay to confirm your booking. Rest on delivery.
          </p>
          {kitchen?.upi_id && (
            <div style={{ fontSize: '0.85rem' }}>
              UPI ID: <b style={{ color: 'var(--primary)' }}>{kitchen.upi_id}</b>
              <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)' }}>
                After paying, mention the advance amount in Special Instructions above.
              </div>
            </div>
          )}
        </div>
      )}

      {payment === 'gpay' && (
        <div className="gpay-qr">
          <div className="qr-box">📷</div>
          <strong>Scan with any UPI app</strong>
          <p style={{ marginTop: 4, color: 'var(--muted)', fontSize: '0.88rem' }}>
            UPI ID: <b style={{ color: 'var(--text)' }}>{kitchen?.upi_id || 'Not configured'}</b>
          </p>
          <p style={{ marginTop: 8, fontWeight: 700 }}>Amount: ₹{total}</p>
          <p style={{ marginTop: 8, color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
            ✅ After payment, click "Confirm Order"
          </p>
        </div>
      )}

      <button className="btn-primary" style={{ marginTop: 20, opacity: loading || kitchenLoading || !kitchen ? 0.7 : 1 }} onClick={placeOrder} disabled={loading || kitchenLoading || !kitchen}>
        {loading ? 'Placing order…' : kitchenLoading ? 'Loading kitchen…' : '✅ Confirm Order'}
      </button>
      <Link href={`/${slug}/cart`} className="btn-outline" style={{ marginTop: 10 }}>← Back to Cart</Link>
    </div>
  );
}
