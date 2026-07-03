'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['open','in_progress','resolved','closed'];
const STATUS_BADGE = {
  open:        { label: '🟡 Open',        bg: '#fef9c3', color: '#854d0e' },
  in_progress: { label: '🔵 In Progress', bg: '#dbeafe', color: '#1e40af' },
  resolved:    { label: '✅ Resolved',    bg: '#dcfce7', color: '#166534' },
  closed:      { label: '⚫ Closed',      bg: '#f3f4f6', color: '#6b7280' },
};
const TYPE_ICON = { bug: '🐛', feature: '💡', incident: '🚨', dispute: '⚖️' };

export default function SuperAdminTicketsPage() {
  const [tickets, setTickets]     = useState([]);
  const [filter,  setFilter]      = useState('open');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await getSupabase()
      .from('tickets')
      .select('*, kitchens(name, slug)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  }

  async function updateStatus(id, status) {
    await getSupabase().from('tickets').update({ status }).eq('id', id);
    load();
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div>
      <div className="admin-hero" style={{ marginBottom: 24 }}>
        <h2>🎫 Support Tickets</h2>
        <p>Issues, feature requests and incidents from kitchen admins</p>
      </div>

      {/* STATS */}
      <div className="admin-stats" style={{ marginBottom: 24 }}>
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="stat-card" style={{ cursor: 'pointer', border: filter === s ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setFilter(s)}>
            <div className="stat-val" style={{ fontSize: '1.5rem' }}>{tickets.filter(t => t.status === s).length}</div>
            <div className="stat-lbl">{STATUS_BADGE[s].label}</div>
          </div>
        ))}
        <div className="stat-card" style={{ cursor: 'pointer', border: filter === 'all' ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setFilter('all')}>
          <div className="stat-val" style={{ fontSize: '1.5rem' }}>{tickets.length}</div>
          <div className="stat-lbl">All</div>
        </div>
      </div>

      {!filtered.length && <div className="empty-state"><div className="ico">🎫</div><p>No {filter} tickets</p></div>}

      {filtered.map((t) => {
        const badge = STATUS_BADGE[t.status] || STATUS_BADGE.open;
        return (
          <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                  {TYPE_ICON[t.type] || '🎫'} {t.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  🏪 {t.kitchens?.name || 'Unknown'} &nbsp;·&nbsp;
                  {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                {badge.label}
              </span>
            </div>
            {t.description && <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: 12 }}>{t.description}</div>}

            {/* Status update */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.filter(s => s !== t.status).map((s) => (
                <button key={s} onClick={() => updateStatus(t.id, s)}
                  style={{ background: STATUS_BADGE[s].bg, color: STATUS_BADGE[s].color, border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                  → {STATUS_BADGE[s].label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
