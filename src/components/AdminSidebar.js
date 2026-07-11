'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

const PLAN_BADGE = {
  starter: { label: '🆓 Starter', color: '#6b7280' },
  growth:  { label: '🔥 Growth',  color: '#ff6b35' },
  pro:     { label: '⭐ Pro',      color: '#8b5cf6' },
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, user, logout } = useAuth();
  const [isMobile, setIsMobile ] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const plan  = profile?.kitchens?.plan || 'starter';
  const badge = PLAN_BADGE[plan] || PLAN_BADGE.starter;
  const kitchenName  = profile?.kitchens?.name || profile?.name || 'Kitchen';

  const NAV = [
    { href: '/admin/orders',    icon: '📋', label: 'Orders',    locked: false },
    { href: '/admin/menu',      icon: '🍽️', label: 'Menu',      locked: false },
    { href: '/admin/customers', icon: '👥', label: 'Customers', locked: false },
    { href: '/admin/branding',  icon: '🎨', label: 'Branding',  locked: plan === 'starter' },
    { href: '/admin/analytics', icon: '📊', label: 'Analytics', locked: plan === 'starter' },
    { href: '/admin/support',   icon: '🎧', label: 'Support',   locked: false },
  ];

  if(isMobile) {
    return (
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: '#1a1a2e', display: 'flex', alignItems: 'center', width: '100%', overflow: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ flexShrink:0, padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '1.2rem' }}>👨‍🍳</span>
          <span style={{ fontSize: '0.55rem', color: badge.color, fontWeight: 700, whiteSpace: 'nowrap'}}>{badge.label}</span>
        </div>
        {NAV.map((item) => (
          item.locked ? (
            <span key={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 12px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'not-allowed'}}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label} 🔒
            </span>
          ) : (
            <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 12px', textDecoration: 'none', flexShrink: 0, color: pathname.startsWith(item.href) ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '0.6rem', whiteSpace: 'nowrap', borderBottom: pathname.startsWith(item.href) ? '2px solid var(--primary)': '2px solid transparent', background: pathname.startsWith(item.href) ? 'rgba(255,107,53,0.15)': 'transparent',}}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        ))}

        <button onClick={logout} style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem'}}>
          <span style={{ fontSize: '1rem'}}>🚪</span>Out
        </button>
      </nav>
    );
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <span>👨‍🍳</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{kitchenName}</div>
          <div style={{ fontSize: '0.7rem', marginTop: 2, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
            {user?.email}
          </div>
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
                tip.style.left  = (rect.right + 10) + 'px';
                tip.style.top   = rect.top + 'px';
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
        <Link href="/admin/password" className="admin-sidebar-link" style={{ fontSize: '0.78rem' }}>
          🔐 Change Password
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
