'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const STATUS_OPTIONS = ['new','onboarded','rejected'];
const STATUS_BADGE = {
  new:       { label: '🟡 New',       bg: '#fef9c3', color: '#854d0e' },
  onboarded: { label: '✅ Onboarded', bg: '#dcfce7', color: '#166534' },
  rejected:  { label: '⚫ Rejected',  bg: '#f3f4f6', color: '#6b7280' },
};
const PLAN_COLOR = { starter: '#6b7280', growth: '#ff6b35', pro: '#8b5cf6' };

export default function SuperAdminLeadsPage() {
  const [leads,  setLeads]  = useState([]);
  const [filter, setFilter] = useState('new');
  const [onboarding, setOnboarding] = useState(null);
  const [obForm, setObForm] = useState({ slug: '', password: '' });
  const [obSaving, setObSaving] = useState(false);
  const [obMessage, setObMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await getSupabase().from('leads').select('*').order('created_at', { ascending: false });
    setLeads(data || []);
  }

  async function updateStatus(id, status) {
    await getSupabase().from('leads').update({ status }).eq('id', id);
    load();
  }

  async function onboardLead() {
    if (!obForm.slug.trim()) { alert('Slug is required'); return; }
    setObSaving(true); setObMessage('');
    const lead = onboarding;
    const password = 'Admin@123';
    const slug = obForm.slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Create kitchen
    const { data: kitchen, error: kErr } = await getSupabase().from('kitchens').insert({
      name: lead.kitchen, slug,phone: lead.phone || '',
      plan: lead.plan || 'starter', active: true,
    }).select().single();
    if(kErr) { setObMessage('❌ '+ kErr.message); setObSaving(false); return; }

    // 2. Create admin user via API
    const res = await fetch('/api/admin/create-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lead.email, password, name: lead.name, kitchen_id: kitchen.id }),
    });
    const result = await res.json();
    if (!res.ok) { setObMessage('❌ ' + result.error); setObSaving(false); return; }

    // 3. Mark lead as onboarded
    await getSupabase().from('leads').update({ status: 'onboarded' }).eq('id', lead.id);

    const siteUrl = window.location.origin;
    setObMessage(`✅ ${lead.kitchen} is live at ${siteUrl}/${slug}\nLogin: ${lead.email} / Admin@123`);
    setObSaving(false);
    setOnboarding(null);
    setObForm({ slug: '' });
    load();
  }

  function contactWhatsApp(lead) {
    const msg = encodeURIComponent(`Hi ${lead.name}! Thanks for your interest in onboarding ${lead.kitchen} on our platform. When would be a good time to discuss?`);
    window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank');
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  return (
    <div>
      <div className="admin-hero" style={{ marginBottom: 24 }}>
        <h2>📥 Leads</h2>
        <p>Kitchen owners who submitted a Get Started request</p>
      </div>

      {/* Onboard popup */}
      {onboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget ) setOnboarding(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>🚀 Onboard {onboarding.kitchen}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 18 }}>
              Kitchen: <b>{onboarding.kitchen}</b><br />
              Admin email: <b>{onboarding.email}</b><br />
              Plan: <b>{onboarding.plan}</b><br />
              Default password: <b>Admin@123</b><br />
            </div>
            <div className="form-group">
              <label>URL SLUG * (e.g. spicefest → yoursite.com/spicefest)</label>
              <input value={obForm.slug} onChange={(e) => setObForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                placeholder="spicefest" autoFocus />
              <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Only lowercase letters and numbers. No spaces.</small>
            </div>
            {obMessage && <div style={{ fontSize: '0.82rem', color: obMessage.startsWith('❌') ? 'var(--red)' : 'var(--green)', marginBottom: 12, fontWeight: 600 }}>{obMessage}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={onboardLead} disabled={obSaving} style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
                {obSaving ? 'Creating...' : '✅ Confirm Onboard'}
              </button>
              <button onClick={() => setOnboarding(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {obMessage && !onboarding && (
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontWeight: 600, color: '#166534', whiteSpace: 'pre-line' }}>
          {obMessage}
        </div>
      )}

      {/* Stats */}
      <div className="admin-stats" style={{ marginBottom: 24 }}>
        {STATUS_OPTIONS.map((s) => (
          <div key={s} className="stat-card" style={{ cursor: 'pointer', border: filter === s ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setFilter(s)}>
            <div className="stat-val" style={{ fontSize: '1.5rem' }}>{leads.filter(l => l.status === s).length}</div>
            <div className="stat-lbl">{STATUS_BADGE[s].label}</div>
          </div>
        ))}
        <div className="stat-card" style={{ cursor: 'pointer', border: filter === 'all' ? '2px solid var(--primary)' : '2px solid transparent' }} onClick={() => setFilter('all')}>
          <div className="stat-val" style={{ fontSize: '1.5rem' }}>{leads.length}</div>
          <div className="stat-lbl">All</div>
        </div>
      </div>

      {!filtered.length && <div className="empty-state"><div className="ico">📥</div><p>No {filter} leads</p></div>}

      {filtered.map((lead) => {
        const badge = STATUS_BADGE[lead.status] || STATUS_BADGE.new;
        return (
          <div key={lead.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lead.kitchen || '—'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                  👤 {lead.name} &nbsp;·&nbsp; 📞 {lead.phone} &nbsp;·&nbsp; 📧 {lead.email || '—'}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (PLAN_COLOR[lead.plan] || '#999') + '22', color: PLAN_COLOR[lead.plan] || '#999' }}>
                    {lead.plan || 'growth'} plan
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 8 }}>
                    {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap', height: 'fit-content' }}>
                {badge.label}
              </span>
            </div>
            {lead.message && <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12, fontStyle: 'italic' }}>"{lead.message}"</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => contactWhatsApp(lead)} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                📱 WhatsApp
              </button>
              {lead.status !== 'onboarded' && lead.email && (
                <button onClick={() => {
                  const suggested = (lead.kitchen || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
                  setObForm({ slug: suggested });
                  setOnboarding(lead);
                  setObMessage('');
                }}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  🚀 Onboard
                </button>
              )}
              {STATUS_OPTIONS.filter(s => s !== lead.status).map((s) => (
                <button key={s} onClick={() => updateStatus(lead.id, s)}
                  style={{ background: STATUS_BADGE[s].bg, color: STATUS_BADGE[s].color, border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
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
