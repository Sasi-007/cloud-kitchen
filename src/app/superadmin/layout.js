'use client';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  async function logout() {
    await getSupabase().auth.signOut();
    router.push('/login');
  }
  return (
    <>
      <header className="admin-nav">
        <span className="admin-nav-logo">⚡ Super Admin</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/superadmin/tickets" className="admin-nav-back">🎧 Tickets</Link>
          <Link href="/" className="admin-nav-back">← Customer View</Link>
          <button onClick={logout} className="admin-nav-back" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>{children}</main>
    </>
  );
}
