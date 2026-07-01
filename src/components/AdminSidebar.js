'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { href: '/admin/orders',    icon: '📋', label: 'Orders'    },
  { href: '/admin/menu',      icon: '🍽️', label: 'Menu'      },
  { href: '/admin/branding',  icon: '🎨', label: 'Branding'  },
  { href: '/admin/analytics', icon: '📊', label: 'Analytics' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <span>👨‍🍳</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{profile?.kitchens?.name || 'Kitchen'}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Admin Panel</div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
          >
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href={`/${profile?.kitchens?.slug || ''}`} className="admin-sidebar-link" style={{ fontSize: '0.82rem' }}>
          👁️ View Store
        </Link>
        <button onClick={logout} className="admin-sidebar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', width: '100%', textAlign: 'left', fontSize: '0.88rem', padding: '10px 12px' }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
