'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function Nav() {
  const { cartCount } = useApp();

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        🍛 Spice<span>Fest</span>
      </Link>
      <Link href="/cart" className="nav-cart-btn">
        🛒 Cart <span className="nav-cart-count">{cartCount}</span>
      </Link>
    </nav>
  );
}
