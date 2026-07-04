'use client';

import Link from 'next/link';
import { PLATFORM_NAME, PLATFORM_EMOJI } from '@/lib/config';

export default function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 56, background: '#fff',
      borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)', flexWrap: 'nowrap', gap: 8,
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: '1.4rem' }}>{PLATFORM_EMOJI}</span>
        <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--primary)' }}>{PLATFORM_NAME}</span>
      </Link>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href="/pricing" style={{ textDecoration: 'none', color: 'var(--muted)', fontWeight: 600, fontSize: '0.82rem', padding: '6px 10px', whiteSpace: 'nowrap' }}>Pricing</Link>
        <Link href="/get-started" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', padding: '6px 10px', whiteSpace: 'nowrap' }}>Get Started</Link>
        <Link href="/login" style={{
          textDecoration: 'none', background: 'var(--primary)', color: '#fff',
          borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap'
        }}>Login</Link>
      </div>
    </nav>
  );
}
