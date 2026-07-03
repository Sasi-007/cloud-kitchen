'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const TYPES = [
  { value: 'bug',      label: '🐛 Bug Report',       desc: 'Something is broken or not working' },
  { value: 'feature',  label: '💡 Feature Request',   desc: 'Suggest an improvement or new feature' },
  { value: 'incident', label: '🚨 Incident',          desc: 'Urgent issue affecting orders or customers' },
  { value: 'dispute',  label: '⚖️ Dispute',           desc: 'Customer complaint or billing issue' },
];

const STATUS_BADGE = {
  open:        { label: '🟡 Open',        bg: '#fef9c3', color: '#854d0e' },
  in_progress: { label: '🔵 In Progress', bg: '#dbeafe', color: '#1e40af' },
  resolved:    { label: '✅ Resolved',    bg: '#dcfce7', color: '#166534' },
  closed:      { label: '⚫ Closed',      bg: '#f3f4f6', color: '#6b7280' },
};

export default function AdminSupportPage() {
  const { profile } = useAuth();
  const [tickets,   setTickets]   = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ type: 'bug', title: '', description: '' });
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // Load tickets once
  useEffect(() => {
    if (!profile?.kitchen_id) return;
    getSupabase().from('tickets').select('*')
      .eq('kitchen_id', profile.kitchen_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTickets(data || []));
  }, [profile]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await getSupabase().from('tickets').insert({
      kitchen_id:  profile.kitchen_id,
      admin_id:    profile.id,
      type:        form.type,
      title:       form.title,
      description: form.description,
    });
    setForm({ type: 'bug', title: '', description: '' });
    setShowForm(false);
    setSaved(true);
    // Reload tickets
    const { data } = await getSupabase().from('tickets').select('*')
      .eq('kitchen_id', profile.kitchen_id).order('created_at', { ascending: false });
    setTickets(data || []);
    setSaving(false);
    setTimeout(() => setSaved(false), 4000);
  }

  // WhatsApp contact to platform owner
  const ownerPhone = process.env.NEXT_PUBLIC_OWNER_PHONE || '';
  function contactWhatsApp() {
    const msg = encodeURIComponent(`Hi! I'm the admin of ${profile?.kitchens?.name}. I need support regarding my kitchen on the platform.`);
    window.open(`https://wa.me/${ownerPhone}?text=${msg}`, '_blank');
  }

  return (
    <div className="admin-page" style={{ maxWidth: 700 }}>
      <div className="admin-hero">
        <h2>🎧 Support</h2>
        <p>Report issues, request features, or raise a dispute</p>
      </div>

      {/* Quick contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#dcfce7', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>📱 WhatsApp Support</div>
          <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 12 }}>
            Chat with us directly for urgent issues
          </div>
          <button onClick={contactWhatsApp} style={{ background: '#25d366', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            Open WhatsApp →
          </button>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🎫 Create Ticket</div>
          <div style={{ fontSize: '0.82rem', color: '#1e40af', marginBottom: 12 }}>
            Log a bug, request a feature, or raise an incident
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : 'New Ticket →'}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontWeight: 600, color: '#166534' }}>
          ✅ Ticket submitted! We'll get back to you soon.
        </div>
      )}

      {/* TICKET FORM */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24, border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20 }}>New Support Ticket</h3>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>TYPE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TYPES.map((t) => (
                  <div key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                    style={{ borderRadius: 12, padding: '12px 14px', cursor: 'pointer', border: `2px solid ${form.type === t.value ? 'var(--primary)' : '#f0f0f0'}`, background: form.type === t.value ? '#fff8f5' : '#fafafa' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>TITLE *</label>
              <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief description of the issue" required />
            </div>
            <div className="form-group">
              <label>DETAILS (optional)</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Steps to reproduce, expected vs actual behaviour, screenshots description…" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 4 }}>
              {saving ? 'Submitting…' : '📩 Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* TICKET HISTORY */}
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Your Tickets</div>
      {tickets === null && <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Loading…</p>}
      {tickets?.length === 0 && <div className="empty-state"><div className="ico">🎫</div><p>No tickets yet</p></div>}
      {tickets?.map((t) => {
        const badge = STATUS_BADGE[t.status] || STATUS_BADGE.open;
        const typeObj = TYPES.find(x => x.value === t.type);
        return (
          <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.title}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                {badge.label}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: t.description ? 8 : 0 }}>
              {typeObj?.label} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {t.description && <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>{t.description}</div>}
          </div>
        );
      })}
    </div>
  );
}
