'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SlugNav({ slug, kitchenName, logoUrl }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function syncCart() {
      try {
        const c = JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}');
        setCartCount(Object.values(c).reduce((s, i) => s + i.qty, 0));
      } catch {}
    }
    syncCart();
    window.addEventListener('storage', syncCart);
    window.addEventListener('cart-updated', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('cart-updated', syncCart);
    };
  }, [slug]);

  return (
    <nav className="nav">
      {/* Logo links back to the SAME kitchen — customers stay isolated */}
      <Link href={`/${slug}`} className="nav-logo" aria-label={kitchenName}>
        {logoUrl ? (
          <div style={{ 
            width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: '#fff', flexShrink: 0, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
          }}>
            <img src={logoUrl} alt={kitchenName} style={{ height: '100%', width: '100%', objectFit: 'contain', padding: 3 }} />
          </div>
        ) : (
          <span style={{ fontSize: '1.5rem', marginRight: 6 }}>🍛</span>
        )}
        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{kitchenName || 'Kitchen'}</span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href={`/${slug}/orders`} style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, textDecoration: 'none' }}>
          My Orders 
        </Link>
        <Link href={`/${slug}/cart`} className="nav-cart-btn" aria-label={`Cart with ${cartCount} items`}>
          🛒 <span className="nav-cart-label">Cart</span>
          <span className="nav-cart-count">{cartCount}</span>
        </Link>
      </div>
    </nav>
  );
}
