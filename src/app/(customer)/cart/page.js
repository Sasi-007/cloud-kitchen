'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function CartPage() {
  const { cart, updateQty, cartTotal, partySize } = useApp();
  const items = Object.values(cart);
  const delivery = cartTotal > 1000 ? 0 : 50;
  const total = cartTotal + delivery;

  if (!items.length) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="ico">🛒</div>
          <p>Your cart is empty</p>
          <Link href="/" className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-title">🛒 Your Cart</div>

      {items.map((item) => (
        <div key={item.id} className="cart-item">
          <div>
            <div className="cart-item-name">{item.emoji} {item.name}</div>
            <div className="cart-item-sub">
              ₹{item.price} × {item.qty} = ₹{item.price * item.qty}
            </div>
          </div>
          <div className="cart-item-right">
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
              <span className="qty-num">{item.qty}</span>
              <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
            <button className="remove-btn" onClick={() => updateQty(item.id, -item.qty)}>🗑️</button>
          </div>
        </div>
      ))}

      <div className="order-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{cartTotal}</span>
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <span>
            {delivery === 0
              ? <span className="free-delivery">FREE</span>
              : `₹${delivery}`}
          </span>
        </div>
        <div className="summary-row">
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Party Size</span>
          <span style={{ fontSize: '0.8rem' }}>{partySize} people</span>
        </div>
        <div className="summary-row summary-total">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <Link href="/checkout" className="btn-primary" style={{ marginTop: 16 }}>
          Proceed to Checkout →
        </Link>
      </div>
    </div>
  );
}
