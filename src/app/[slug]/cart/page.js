'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SlugCartPage({ params }) {
  const { slug } = params;
  const [cart, setCart] = useState({});

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}'));
    } catch {}
  }, [slug]);

  function saveCart(next) {
    setCart(next);
    localStorage.setItem(`ck_cart_${slug}`, JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
  }

  function updateQty(id, delta) {
    const qty  = (cart[id]?.qty || 0) + delta;
    const next = { ...cart };
    if (qty <= 0) delete next[id]; else next[id] = { ...cart[id], qty };
    saveCart(next);
  }

  const items    = Object.values(cart);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 1000 ? 0 : 50;
  const total    = subtotal + delivery;

  if (!items.length) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="ico">🛒</div>
          <p>Your cart is empty</p>
          <Link href={`/${slug}`} className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Browse Menu</Link>
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
            <div className="cart-item-name">{item.emoji || '🍽️'} {item.name}</div>
            <div className="cart-item-sub">₹{item.price} × {item.qty} = ₹{item.price * item.qty}</div>
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
        <div className="summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
        <div className="summary-row">
          <span>Delivery</span>
          <span>{delivery === 0 ? <span className="free-delivery">FREE</span> : `₹${delivery}`}</span>
        </div>
        <div className="summary-row summary-total"><span>Total</span><span>₹{total}</span></div>
        <Link href={`/${slug}/checkout`} className="btn-primary" style={{ marginTop: 16 }}>Proceed to Checkout →</Link>
      </div>
    </div>
  );
}
