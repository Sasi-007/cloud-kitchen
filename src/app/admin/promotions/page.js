'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export const dynamic = 'force-dynamic';

const TYPE_CONFIG = {
  offer:  { icon: '🎉', label: 'Discount Offer',  color: '#ff6b35', bg: '#fff8f5' },
  menu:   { icon: '🍽️', label: 'Special Menu',    color: '#7c3aed', bg: '#f5f3ff' },
  notice: { icon: '📢', label: 'Notice / Update', color: '#0284c7', bg: '#f0f9ff' },
};

export default function AdminPromotionsPage() {
  const { profile } = useAuth();
  const [promos,     setPromos]     = useState([]); // multiple active promos
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ title: '', description: '', type: 'offer' });
  const [saving,    setSaving]    = useState(false);
  const [message,   setMessage]   = useState('');

  useEffect(() => { if (profile?.kitchen_id) load(); }, [profile]);

  async function load() {
    const { data } = await getSupabase().from('promotions')
      .select('*').eq('kitchen_id', profile.kitchen_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    setPromos(data || []);
  }

  async function save() {
    if (!form.title.trim()) { setMessage('❌ Title is required'); return; }
    setSaving(true); setMessage('');
    // Set expiry to end of today (midnight)
    const eod = new Date(); eod.setHours(23, 59, 59, 0);
    const { error } = await getSupabase().from('promotions').insert({
      kitchen_id:  profile.kitchen_id,
      title:       form.title,
      description: form.description || null,
      type:        form.type,
      expires_at:  eod.toISOString(),
    });
    if (error) setMessage('❌ ' + error.message);
    else { setMessage('✅ Promotion published!'); setForm({ title: '', description: '', type: 'offer' }); setShowForm(false); load(); }
    setSaving(false);
  }

  async function deletePromo(id) {
    if (!confirm('Remove this promotion?')) return;
    await getSupabase().from('promotions').delete().eq('id', id);
    setPromos(p => p.filter(x => x.id !==id));
  }

  return (
    <div className="admin-page" style={{ maxWidth: 640 }}>
      <div className="admin-hero">
        <h2>📢 Today&apos;s Special</h2>
        <p>Show a promotional banner to customers on your menu page — auto-expires at midnight</p>
      </div>

      {message && <div style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fef2f2', border: `1.5px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontWeight: 600, color: message.startsWith('✅') ? '#166534' : '#991b1b' }}>{message}</div>}

      {/* Active promotions list */}
      {promos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', color: 'var(--muted)' }}>
            {promos.length} active promotion{promos.length > 1 ? 's': ''} - all visible to customers
          </div>
          {promos.map(p => {
            const cfg = TYPE_CONFIG[p.type] || TYPE_CONFIG.offer;
            return (
              <div key={p.id} style={{ background: cfg.bg, border: `2px solid ${cfg.color}`, borderRadius: 14,padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10}}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: cfg.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3}}>{cfg.icon}{cfg.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: p.description ? 3 : 0}}>{p.title}</div>
                  {p.description && <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{p.description}</div>}
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4}}>Expires:{new Date(p.expires_at).toLocaleString('en-IN',{ hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <button onClick={() => deletePromo(p.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0}}>🗑️ Remove</button>
              </div>
            );
          })}
        </div>
      )}

      {promos.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f9fafb', borderRadius: 16, marginBottom: 20, border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📢</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No active promotions</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16 }}>Create promotions to show customers on your menu page. All expire at midnight.</div>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setShowForm(true)}>+ Add Promotion</button>
        </div>
      )}

      {promos.length > 0 && !showForm && (
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px', marginBottom: 20 }} onClick={() => setShowForm(true)}>+ Add Another Promotion</button>
      )}

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 18 }}>New Promotion</h3>
          <div className="form-group">
            <label>TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 4 }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} onClick={() => setForm(p => ({...p, type: key}))}
                  style={{ border: `2px solid ${form.type === key ? cfg.color : '#e5e7eb'}`, background: form.type === key ? cfg.bg : '#fff', borderRadius: 12, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.4rem' }}>{cfg.icon}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4, color: form.type === key ? cfg.color : 'var(--muted)' }}>{cfg.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>TITLE *</label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Today Special: Buy ₹1000 get 10% off!" />
          </div>
          <div className="form-group">
            <label>DETAILS (optional)</label>
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={3} placeholder="Add more details, terms, or featured menu items…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
              {saving ? 'Publishing…' : '🚀 Publish Now'}
            </button>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
