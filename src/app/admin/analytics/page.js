'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function UpgradeWall({ feature }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontWeight: 800, marginBottom: 8 }}>{feature} — Growth Feature</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
        Upgrade to the Growth plan to unlock {feature.toLowerCase()}, analytics, custom branding and more.
      </p>
      <Link href="/pricing" className="btn-primary" style={{ maxWidth: 220, margin: '0 auto', display: 'block' }}>View Plans &amp; Upgrade</Link>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { profile } = useAuth();
  const [orders,    setOrders]   = useState([]);
  const [feedback,  setFeedback] = useState([]);
  const [loading,   setLoading]  = useState(true);

  const plan = profile?.kitchens?.plan || 'starter';
  if (profile && plan === 'starter') return <UpgradeWall feature="Analytics" />;

  useEffect(() => {
    if (!profile?.kitchen_id) return;
    async function load() {
      const supabase = getSupabase();
      const [{ data: o }, { data: f }] = await Promise.all([
        supabase.from('orders').select('*').eq('kitchen_id', profile.kitchen_id).order('created_at', { ascending: false }),
        // Join feedback with orders to get customer name + phone
        supabase.from('feedback').select('*, orders(customer_name, customer_phone)').eq('kitchen_id', profile.kitchen_id).order('created_at', { ascending: false }),
      ]);
      setOrders(o || []);
      setFeedback(f || []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const today          = new Date().toDateString();
  const todayOrders    = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const todayRevenue   = todayOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const totalRevenue   = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const confirmedAmt   = orders.reduce((s, o) => s + (o.amount_received || 0), 0);
  const pendingAmt     = orders.filter((o) => o.payment_status !== 'confirmed' && !o.is_deleted)
                               .reduce((s, o) => s + (o.total - (o.amount_received || 0)), 0);
  const avgRating      = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';

  // Popular items
  const itemCount = {};
  orders.forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
    items.forEach((i) => { itemCount[i.name] = (itemCount[i.name] || 0) + i.qty; });
  });
  const topItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Last 7 days revenue
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const rev = orders.filter((o) => new Date(o.created_at).toDateString() === key && o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), rev };
  });
  const maxRev = Math.max(...last7.map((d) => d.rev), 1);

  if (loading) return <div className="admin-page" style={{ color: 'var(--muted)' }}>Loading analytics…</div>;

  return (
    <div className="admin-page">
      <div className="admin-hero"><h2>📊 Analytics</h2><p>Revenue, popular items, and customer feedback overview</p></div>

      {/* KPI CARDS */}
      <div className="admin-stats" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>₹{todayRevenue.toLocaleString('en-IN')}</div><div className="stat-lbl">Today&apos;s Revenue</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{todayOrders.length}</div><div className="stat-lbl">Today&apos;s Orders</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#8b5cf6' }}>₹{confirmedAmt.toLocaleString('en-IN')}</div><div className="stat-lbl">Collected</div></div>
        {pendingAmt > 0 && <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>₹{pendingAmt.toLocaleString('en-IN')}</div><div className="stat-lbl">Pending Payment</div></div>}
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>⭐ {avgRating}</div><div className="stat-lbl">Avg Rating ({feedback.length} reviews)</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 28 }}>
        {/* Revenue Chart (last 7 days) */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Last 7 Days Revenue</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {last7.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600 }}>₹{d.rev > 0 ? (d.rev/1000).toFixed(1)+'k' : '0'}</div>
                <div style={{ width: '100%', background: d.rev > 0 ? 'var(--primary)' : '#f0f0f0', borderRadius: 4, height: `${Math.max((d.rev / maxRev) * 90, d.rev > 0 ? 8 : 4)}px`, transition: 'height 0.3s' }} />
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>🔥 Top Items</div>
          {!topItems.length && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No data yet</p>}
          {topItems.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '0.88rem' }}>{i + 1}. {name}</span>
              <span className="badge badge-new">{count} sold</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Order Status Breakdown</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['new','progress','delivered'].map((s) => {
            const cnt = orders.filter((o) => o.status === s).length;
            const pct = orders.length ? Math.round((cnt / orders.length) * 100) : 0;
            return (
              <div key={s} style={{ flex: 1, minWidth: 120 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s === 'new' ? '🟡 New' : s === 'progress' ? '🔵 In Progress' : '✅ Delivered'}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cnt}</span>
                </div>
                <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s === 'new' ? 'var(--yellow)' : s === 'progress' ? 'var(--primary)' : 'var(--green)', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Feedback */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>Customer Feedback</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{feedback.length} total review{feedback.length !== 1 ? 's' : ''}</div>
        </div>

        {!feedback.length && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No feedback yet — feedback appears after customers rate their delivered orders.</p>}

        {/* Improvement tips based on negative tags */}
        {(() => {
          const allTags = feedback.flatMap((f) => f.tags || []);
          const tips = [];
          if (allTags.filter((t) => t.includes('Delayed')).length >= 2)   tips.push('⚡ Multiple customers reported slow delivery — review delivery time estimates');
          if (allTags.filter((t) => t.includes('Average')).length >= 2)   tips.push('😐 Some customers felt experience was average — consider following up personally');
          if (allTags.filter((t) => t.includes('hot')).length >= 2)       tips.push('🌡️ Customers liked hot food — maintain packaging quality');
          if (feedback.filter((f) => f.rating <= 2).length >= 1)          tips.push('⚠️ You have low ratings — read those comments carefully and reach out to the customer');
          if (!tips.length && feedback.length >= 3)                        tips.push('✅ Great feedback overall — keep it up!');
          return tips.length > 0 ? (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8, color: '#92400e' }}>💡 Insights to improve</div>
              {tips.map((t, i) => <div key={i} style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: 4 }}>• {t}</div>)}
            </div>
          ) : null;
        })()}

        {feedback.slice(0, 10).map((f) => (
          <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{'⭐'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: f.rating >= 4 ? 'var(--green)' : f.rating === 3 ? 'var(--yellow)' : 'var(--red)' }}>
                  {f.rating}/5
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {/* Customer name + phone from joined orders table */}
            {f.orders && (
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>
                👤 {f.orders.customer_name} &nbsp;·&nbsp; 📞 {f.orders.customer_phone}
              </div>
            )}
            {f.tags?.length > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginBottom: 4 }}>{f.tags.join(' · ')}</div>}
            {f.comment && <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>&ldquo;{f.comment}&rdquo;</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
