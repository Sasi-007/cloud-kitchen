'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever free',
    color: '#6b7280',
    current: (plan) => plan === 'starter',
    features: ['Orders dashboard', 'Menu management', 'COD payments', 'Order tracking', 'Customer support tickets'],
    locked: ['Logo & banner upload', 'Analytics', 'GPay / UPI', 'Feedback system'],
  },
  {
    name: 'Growth',
    price: '₹999',
    sub: '/month',
    color: '#ff6b35',
    highlight: true,
    current: (plan) => plan === 'growth',
    features: ['Everything in Starter', 'Logo & banner upload', 'Analytics dashboard', 'Customer feedback & ratings', 'GPay / UPI QR at checkout', 'WhatsApp notifications'],
    locked: [],
  },
  {
    name: 'Pro',
    price: '₹2,499',
    sub: '/month',
    color: '#8b5cf6',
    current: (plan) => plan === 'pro',
    features: ['Everything in Growth', 'Up to 5 kitchens', 'Advanced analytics', 'Priority support', 'Custom domain support'],
    locked: [],
  },
];

export default function AdminSubscriptionPage() {
  const { profile } = useAuth();
  const plan = profile?.kitchens?.plan || 'starter';
  const ownerPhone = process.env.NEXT_PUBLIC_OWNER_PHONE || '';

  function contactToUpgrade(planName) {
    const msg = encodeURIComponent(
      `Hi! I'm the admin of ${profile?.kitchens?.name}. I'd like to upgrade to the ${planName} plan. Please help me with the process.`
    );
    window.open(`https://wa.me/${ownerPhone}?text=${msg}`, '_blank');
  }

  return (
    <div className="admin-page" style={{ maxWidth: 800 }}>
      <div className="admin-hero">
        <h2>📦 Your Plan</h2>
        <p>Manage your subscription and unlock more features</p>
      </div>

      {/* Current plan banner */}
      <div style={{ background: 'linear-gradient(135deg,#fff8f5,#ffe8db)', border: '1.5px solid #ffcbb0', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>
            Current plan: <span style={{ color: 'var(--primary)' }}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 2 }}>
            {plan === 'starter' ? 'Free forever — upgrade anytime to unlock more features' :
             plan === 'growth'  ? 'Analytics, branding and GPay unlocked' :
             'All features unlocked'}
          </div>
        </div>
        {plan === 'starter' && (
          <div style={{ fontSize: '0.78rem', background: '#fff', border: '1px solid #ffcbb0', borderRadius: 8, padding: '6px 12px', color: 'var(--muted)' }}>
            🆓 Free plan · No expiry
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        {PLANS.map((p) => {
          const isCurrent = p.current(plan);
          return (
            <div key={p.name} style={{
              background: '#fff', borderRadius: 18, padding: '24px 20px',
              border: isCurrent ? `2px solid ${p.color}` : p.highlight ? '2px solid var(--primary)' : '1.5px solid #f0f0f0',
              boxShadow: p.highlight ? '0 4px 24px rgba(255,107,53,0.12)' : '0 1px 8px rgba(0,0,0,0.06)',
              position: 'relative',
            }}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: -12, left: 20, background: p.color, color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '0.7rem', fontWeight: 800 }}>
                  ✓ Current Plan
                </div>
              )}
              {p.highlight && !isCurrent && (
                <div style={{ position: 'absolute', top: -12, left: 20, background: 'var(--primary)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: '0.7rem', fontWeight: 800 }}>
                  ⭐ Recommended
                </div>
              )}
              <div style={{ color: p.color, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#111', lineHeight: 1 }}>{p.price}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 16 }}>{p.sub}</div>

              {!isCurrent && (
                <button
                  onClick={() => contactToUpgrade(p.name)}
                  style={{ width: '100%', background: isCurrent ? '#f3f4f6' : p.highlight ? 'var(--primary)' : '#f3f4f6', color: isCurrent ? '#999' : p.highlight ? '#fff' : '#333', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: '0.88rem', cursor: isCurrent ? 'default' : 'pointer', marginBottom: 16 }}
                  disabled={isCurrent}
                >
                  {isCurrent ? '✓ Active' : `Upgrade to ${p.name} →`}
                </button>
              )}
              {isCurrent && <div style={{ height: 16 }} />}

              {p.features.map((f) => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', marginBottom: 7 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
              {p.locked.map((f) => (
                <div key={f} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', marginBottom: 7, opacity: 0.35 }}>
                  <span>✕</span> {f}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
        To upgrade, click the plan button above — it opens a WhatsApp message to our team.<br />
        We'll activate your plan within a few hours.
      </div>
    </div>
  );
}
