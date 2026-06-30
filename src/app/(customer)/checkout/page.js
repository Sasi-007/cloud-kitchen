'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function CheckoutPage() {
  const { cart, cartTotal, partySize, clearCart, addOrder, showToast } = useApp();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [payment, setPayment] = useState('');

  const delivery = cartTotal > 1000 ? 0 : 50;
  const total = cartTotal + delivery;
  const items = Object.values(cart);

  function handleField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function placeOrder() {
    if (!form.name || !form.phone || !form.address) {
      showToast('⚠️ Please fill all required fields');
      return;
    }
    if (!payment) {
      showToast('⚠️ Please select a payment method');
      return;
    }
    if (!items.length) {
      showToast('⚠️ Cart is empty');
      return;
    }

    const id = 'SF-' + (20000 + Math.floor(Math.random() * 9999));
    const order = {
      id,
      name: form.name,
      phone: form.phone,
      address: form.address,
      note: form.note,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji })),
      total,
      party: partySize,
      payment,
      status: 'new',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    // In production: POST to /api/orders → Supabase insert + WhatsApp notification
    addOrder(order);
    clearCart();
    showToast('✅ Order placed successfully!');
    router.push(`/order/${id}`);
  }

  return (
    <div className="page" style={{ maxWidth: 600 }}>
      <div className="section-title">📋 Place Order</div>

      <div className="info-box">
        ⚠️ Orders are prepared in bulk. Min order for 10 people. Please confirm party count before proceeding.
      </div>

      <div className="form-group">
        <label>YOUR NAME</label>
        <input name="name" value={form.name} onChange={handleField} placeholder="Ravi Kumar" />
      </div>
      <div className="form-group">
        <label>PHONE NUMBER (WhatsApp)</label>
        <input name="phone" value={form.phone} onChange={handleField} placeholder="+91 98765 43210" type="tel" />
      </div>
      <div className="form-group">
        <label>DELIVERY ADDRESS</label>
        <textarea name="address" value={form.address} onChange={handleField} rows={2} placeholder="Plot 12, HITEC City, Hyderabad..." />
      </div>
      <div className="form-group">
        <label>SPECIAL INSTRUCTIONS (optional)</label>
        <input name="note" value={form.note} onChange={handleField} placeholder="No onion, extra spicy, etc." />
      </div>

      <div className="divider" />
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Select Payment Method</div>

      <div className="payment-options">
        <div
          className={`pay-opt ${payment === 'cod' ? 'selected' : ''}`}
          onClick={() => setPayment('cod')}
        >
          <div className="pay-icon">💵</div>
          <h4>Cash on Delivery</h4>
          <p>Pay when food arrives</p>
        </div>
        <div
          className={`pay-opt ${payment === 'gpay' ? 'selected' : ''}`}
          onClick={() => setPayment('gpay')}
        >
          <div className="pay-icon">📱</div>
          <h4>GPay / UPI</h4>
          <p>Scan &amp; pay instantly</p>
        </div>
      </div>

      {payment === 'gpay' && (
        <div className="gpay-qr">
          <div className="qr-box">📷</div>
          <strong>Scan with any UPI app</strong>
          <p style={{ marginTop: 4, color: 'var(--muted)', fontSize: '0.88rem' }}>
            UPI ID: <b style={{ color: 'var(--text)' }}>spicefest@okaxis</b>
          </p>
          <p style={{ marginTop: 8, fontWeight: 700 }}>Amount: ₹{total}</p>
          <p style={{ marginTop: 8, color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
            ✅ After payment, click "Confirm Order" below
          </p>
        </div>
      )}

      <button className="btn-primary" style={{ marginTop: 20 }} onClick={placeOrder}>
        ✅ Confirm Order
      </button>
      <Link href="/cart" className="btn-outline" style={{ marginTop: 10 }}>
        ← Back to Cart
      </Link>
    </div>
  );
}
