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
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '', delivery_date: '', delivery_time: '' });

  const [couponCode,    setCouponCode]    = useState('');
  const [couponApplied, setCouponApplied] = useState(null); // {id, code, type, value}
  const [couponErr,     setCouponErr]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  // Load cart from localStorage and fetch kitchen data
  useEffect(() => {
    getSupabase().from('kitchens').select('id,name,upi_id,plan,delivery_fee,free_delivery_above').eq('slug', slug).single()
      .then(({ data }) => setKitchen(data));
    try { setCart(JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}')); } catch {}
  }, [slug]);

  // Calculate subtotal, delivery, discount from cart and kitchen
  const items     = Object.values(cart);
  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0);
  const freeAbove = kitchen?.free_delivery_above ?? 1000;
  const fee       = kitchen?.delivery_fee ?? 50;
  const delivery  = !kitchen ? 50 : freeAbove === 0 ? fee : subtotal >= freeAbove ? 0 : fee;
  const discount = couponApplied
    ? couponApplied.type === 'percent'
      ? Math.round(subtotal * couponApplied.value / 100)
      : Math.min(couponApplied.value, subtotal)
    : 0;
  const total     = subtotal + delivery - discount;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponErr(''); setCouponApplied(null);
    const code = couponCode.trim().toUpperCase();
    const { data: c } = await getSupabase().from('coupons').select('*')
      .eq('kitchen_id', kitchen.id).eq('code', code).eq('active', true).single();
    if (!c) { setCouponErr('Invalid or expired coupon code'); setCouponLoading(false); return; }
    if (c.used_count >= c.max_uses) { setCouponErr('This coupon has reached its usage limit'); setCouponLoading(false); return; }
    if (c.min_order > 0 && subtotal < c.min_order) { setCouponErr(`Minimum order ₹${c.min_order} required for this coupon`); setCouponLoading(false); return; }
    setCouponApplied(c);
    setCouponLoading(false);
  }

  const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
    const h = i + 10;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    return label;
  });

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
      delivery_date:  form.delivery_date || null,
      delivery_time:  form.delivery_time || null,
      items:          items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️' })),
      total,
      payment_method: payment,
      status:         'new',
      coupon_code:    couponApplied?.code || null,
      discount_amount: discount || 0,
    };

    const { error } = await getSupabase().from('orders').insert(order);
    if (error) { alert('Failed to place order. Please try again.'); setLoading(false); return; }

    // Increment coupon usage count
    if (couponApplied) {
      await getSupabase().from('coupons').update({ used_count: couponApplied.used_count + 1 }).eq('id', couponApplied.id);
    }

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

      {/* COUPON CODE */}
      <div className="divider" />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>🎟️ Have a coupon?</div>
      {couponApplied ? (
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#166534' }}>✅ {couponApplied.code} applied!</div>
            <div style={{ fontSize: '0.82rem', color: '#166534' }}>
              {couponApplied.type === 'percent' ? `${couponApplied.value}% off` : `₹${couponApplied.value} off`} — saving ₹{discount}
            </div>
          </div>
          <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Remove</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            style={{ flex: 1, minWidth: 160, padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem', textTransform: 'uppercase' }}
            onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
          <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 18px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: (!couponCode.trim() || couponLoading) ? 0.6 : 1 }}>
            {couponLoading ? '…' : 'Apply'}
          </button>
        </div>
      )}
      {couponErr && <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: 6 }}>❌ {couponErr}</div>}

      <div className="divider" />
      <div className="payment-options">
        <div className={`pay-opt ${payment === 'cod' ? 'selected' : ''}`} onClick={() => setPayment('cod')}>
          <div className="pay-icon">💵</div><h4>Cash on Delivery</h4><p>Pay when food arrives</p>
        </div>
        {kitchen?.plan !== 'starter' && (
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

      {/* Order summary */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', marginTop: 20, marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
          <span>Subtotal</span><span>₹{subtotal}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4, color: 'var(--green)', fontWeight: 600 }}>
            <span>🎟️ Discount ({couponApplied?.code})</span><span>−₹{discount}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6, color: delivery === 0 ? 'var(--green)' : 'var(--muted)' }}>
          <span>Delivery</span>
          <span>{delivery === 0 ? 'FREE 🎉' : `₹${delivery}`}</span>
        </div>
        {delivery > 0 && freeAbove > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
            Add ₹{freeAbove - subtotal} more for free delivery
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{total}</span>
        </div>
      </div>

      <button className="btn-primary" style={{ marginTop: 12, opacity: loading ? 0.7 : 1 }} onClick={placeOrder} disabled={loading}>
        {loading ? 'Placing order…' : '✅ Confirm Order'}
      </button>
      <Link href={`/${slug}/cart`} className="btn-outline" style={{ marginTop: 10 }}>← Back to Cart</Link>
    </div>
  );
}
