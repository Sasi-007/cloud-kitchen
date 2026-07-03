'use client';

import Link from 'next/link';
import { PLATFORM_NAME, PLATFORM_EMOJI } from '@/lib/config';

export default function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 64, background: '#fff',
      borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.6rem' }}>{PLATFORM_EMOJI}</span>
        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>{PLATFORM_NAME}</span>
      </Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/pricing" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem', padding: '8px 14px' }}>Pricing</Link>
        <Link href="/get-started" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', padding: '8px 14px' }}>Get Started</Link>
        <Link href="/login" style={{
          textDecoration: 'none', background: 'var(--primary)', color: '#fff',
          borderRadius: 10, padding: '8px 18px', fontWeight: 700, fontSize: '0.9rem'
        }}>Admin Login</Link>
      </div>
    </nav>
  );
}
