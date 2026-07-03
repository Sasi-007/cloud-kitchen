'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function SlugCheckoutPage({ params }) {
  const { slug }  = params;
  const router    = useRouter();
  const [kitchen, setKitchen]   = useState(null);
  const [cart,    setCart]      = useState({});
  const [payment, setPayment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [form,    setForm]      = useState({ name: '', phone: '', address: '', note: '' });

  useEffect(() => {
    getSupabase().from('kitchens').select('id,name,upi_id,plan').eq('slug', slug).single()
      .then(({ data }) => setKitchen(data));
    try { setCart(JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}')); } catch {}
  }, [slug]);

  const items    = Object.values(cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 1000 ? 0 : 50;
  const total    = subtotal + delivery;

  function field(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) { alert('Please fill all required fields'); return; }
    if (!payment) { alert('Please select a payment method'); return; }
    if (!items.length || !kitchen) return;
    setLoading(true);

    // UUID-based order ID — unguessable, safe to use as tracking token
    const id = 'SF-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    const order = {
      id,
      kitchen_id:     kitchen.id,
      customer_name:  form.name,
      customer_phone: form.phone,
      address:        form.address,
      note:           form.note,
      items:          items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️' })),
      total,
      payment_method: payment,
      status:         'new',
    };

    const { error } = await getSupabase().from('orders').insert(order);
    if (error) { alert('Failed to place order. Please try again.'); setLoading(false); return; }

    localStorage.removeItem(`ck_cart_${slug}`);
    window.dispatchEvent(new Event('cart-updated'));
    router.push(`/${slug}/order/${id}`);
  }

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="section-title">📋 Place Order</div>
      <div className="info-box">⚠️ Orders are prepared in bulk. Please confirm party count before proceeding.</div>

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
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Select Payment Method</div>
      <div className="payment-options">
        <div className={`pay-opt ${payment === 'cod' ? 'selected' : ''}`} onClick={() => setPayment('cod')}>
          <div className="pay-icon">💵</div><h4>Cash on Delivery</h4><p>Pay when food arrives</p>
        </div>
        {/* GPay only available on Growth/Pro plan */}
        {kitchen?.plan !== 'starter' && (
          <div className={`pay-opt ${payment === 'gpay' ? 'selected' : ''}`} onClick={() => setPayment('gpay')}>
            <div className="pay-icon">📱</div><h4>GPay / UPI</h4><p>Scan &amp; pay instantly</p>
          </div>
        )}
      </div>

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

      <button className="btn-primary" style={{ marginTop: 20, opacity: loading ? 0.7 : 1 }} onClick={placeOrder} disabled={loading}>
        {loading ? 'Placing order…' : '✅ Confirm Order'}
      </button>
      <Link href={`/${slug}/cart`} className="btn-outline" style={{ marginTop: 10 }}>← Back to Cart</Link>
    </div>
  );
}
