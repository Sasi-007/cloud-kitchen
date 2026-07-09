'use client';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  async function logout() {
    await getSupabase().auth.signOut();
    router.push('/login');
  }
  return (
    <>
      <header className="admin-nav">
        <Link href="/superadmin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="admin-nav-logo">⚡ Super Admin</span>
        </Link>
        <div className="admin-nav-links">
          {user?.email && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', padding: '6px 4px' }}>{user.email}</span>}
          <Link href="/superadmin" className="admin-nav-back">🏠 Home</Link>
          <Link href="/superadmin/leads" className="admin-nav-back">📥 Leads</Link>
          <Link href="/superadmin/tickets" className="admin-nav-back">🎧 Tickets</Link>
          <button onClick={logout} className="admin-nav-back" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>{children}</main>
    </>
  );
}
