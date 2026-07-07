'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PLAN_BADGE = {
  starter: { label: '🆓 Starter', color: '#6b7280' },
  growth:  { label: '🔥 Growth',  color: '#ff6b35' },
  pro:     { label: '⭐ Pro',      color: '#8b5cf6' },
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const plan  = profile?.kitchens?.plan || 'starter';
  const badge = PLAN_BADGE[plan] || PLAN_BADGE.starter;

  const NAV = [
    { href: '/admin/orders',    icon: '📋', label: 'Orders',    locked: false },
    { href: '/admin/menu',      icon: '🍽️', label: 'Menu',      locked: false },
    { href: '/admin/customers', icon: '👥', label: 'Customers', locked: false },
    { href: '/admin/branding',  icon: '🎨', label: 'Branding',  locked: plan === 'starter' },
    { href: '/admin/analytics', icon: '📊', label: 'Analytics', locked: plan === 'starter' },
    { href: '/admin/support',   icon: '🎧', label: 'Support',   locked: false },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <span>👨‍🍳</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{profile?.kitchens?.name || 'Kitchen'}</div>
          <div style={{ fontSize: '0.7rem', marginTop: 3, display: 'inline-block', background: badge.color + '33', color: badge.color, borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>
            {badge.label}
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV.map((item) =>
          item.locked ? (
            <div key={item.href} className="sidebar-locked-wrap"
              onMouseEnter={(e) => {
                const tip = e.currentTarget.querySelector('.sidebar-tooltip');
                if (!tip) return;
                const rect = e.currentTarget.getBoundingClientRect();
                // On desktop sidebar (vertical): show to the right
                // On mobile top bar: show below
                if (rect.left < 250) {
                  tip.style.left  = (rect.right + 10) + 'px';
                  tip.style.top   = rect.top + 'px';
                } else {
                  tip.style.left  = rect.left + 'px';
                  tip.style.top   = (rect.bottom + 8) + 'px';
                }
              }}
            >
              <span
                className="admin-sidebar-link sidebar-locked"
              >
                <span>{item.icon}</span> {item.label}
                <span style={{ fontSize: '0.62rem', marginLeft: 'auto' }}>🔒</span>
              </span>
              <div className="sidebar-tooltip">
                <div style={{ fontWeight: 700, marginBottom: 3 }}>✨ {item.label} — Growth Feature</div>
                <div style={{ opacity: 0.85, fontSize: '0.75rem' }}>Upgrade your plan to unlock this and more premium features.</div>
              </div>
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          )
        )}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href={`/${profile?.kitchens?.slug || ''}`} className="admin-sidebar-link" style={{ fontSize: '0.82rem' }}>
          👁️ View Store
        </Link>
        {plan === 'starter' && (
          <Link href="/admin/subscription" className="admin-sidebar-link" style={{ fontSize: '0.78rem', background: 'rgba(255,107,53,0.15)', color: '#ff6b35' }}>
            ⬆️ Upgrade Plan
          </Link>
        )}
        <button onClick={logout} className="admin-sidebar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', width: '100%', textAlign: 'left', fontSize: '0.88rem', padding: '10px 12px' }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
