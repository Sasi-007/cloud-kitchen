'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Page title shown in browser tab
export const dynamic = 'force-dynamic';

const BLANK = { code: '', type: 'percent', value: '', min_order: '0', max_uses: '1', active: true };

export default function AdminCouponsPage() {
  const { profile } = useAuth();
  const [coupons,   setCoupons]   = useState([]);
  const [form,      setForm]      = useState(BLANK);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [message,   setMessage]   = useState('');

  useEffect(() => { if (profile?.kitchen_id) load(); }, [profile]);

  async function load() {
    const { data } = await getSupabase().from('coupons').select('*')
      .eq('kitchen_id', profile.kitchen_id).order('created_at', { ascending: false });
    setCoupons(data || []);
  }

  async function save() {
    if (!form.code || !form.value) { setMessage('❌ Code and value are required'); return; }
    setSaving(true); setMessage('');
    const payload = {
      kitchen_id: profile.kitchen_id,
      code:       form.code.toUpperCase().trim(),
      type:       form.type,
      value:      Number(form.value),
      min_order:  Number(form.min_order) || 0,
      max_uses:   Number(form.max_uses) || 1,
      active:     form.active,
    };
    const { error } = await getSupabase().from('coupons').insert(payload);
    if (error) setMessage('❌ ' + (error.message.includes('unique') ? 'Code already exists' : error.message));
    else { setMessage('✅ Coupon created!'); setForm(BLANK); setShowForm(false); load(); }
    setSaving(false);
  }

  async function toggleActive(id, val) {
    await getSupabase().from('coupons').update({ active: val }).eq('id', id);
    load();
  }

  async function deleteCoupon(id, code) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await getSupabase().from('coupons').delete().eq('id', id);
    load();
  }

  return (
    <div className="admin-page" style={{ maxWidth: 700 }}>
      <div className="admin-hero">
        <h2>🎟️ Coupons & Discounts</h2>
        <p>Create discount codes for your customers</p>
      </div>

      {message && <div style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fef2f2', border: `1.5px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontWeight: 600, color: message.startsWith('✅') ? '#166534' : '#991b1b' }}>{message}</div>}

      <div style={{ marginBottom: 20 }}>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24, border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 18 }}>Create Coupon</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label>COUPON CODE *</label>
              <input value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="SAVE10" style={{ textTransform: 'uppercase' }} />
              <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>Letters and numbers only</small>
            </div>
            <div className="form-group">
              <label>DISCOUNT TYPE *</label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem', background: '#fff' }}>
                <option value="percent">% Percentage off</option>
                <option value="flat">₹ Flat amount off</option>
              </select>
            </div>
            <div className="form-group">
              <label>{form.type === 'percent' ? 'DISCOUNT %' : 'DISCOUNT ₹'} *</label>
              <input type="number" min="1" max={form.type === 'percent' ? 100 : undefined} value={form.value}
                onChange={e => setForm(p => ({...p, value: e.target.value}))} placeholder={form.type === 'percent' ? '10' : '100'} />
            </div>
            <div className="form-group">
              <label>MIN ORDER VALUE (₹)</label>
              <input type="number" min="0" value={form.min_order} onChange={e => setForm(p => ({...p, min_order: e.target.value}))} placeholder="500" />
              <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>0 = no minimum</small>
            </div>
            <div className="form-group">
              <label>MAX USES</label>
              <input type="number" min="1" value={form.max_uses} onChange={e => setForm(p => ({...p, max_uses: e.target.value}))} placeholder="1" />
              <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>How many orders can use this code</small>
            </div>
          </div>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : '🎟️ Create Coupon'}
          </button>
        </div>
      )}

      {!coupons.length && !showForm && (
        <div className="empty-state"><div className="ico">🎟️</div><p>No coupons yet. Create one to offer discounts.</p></div>
      )}

      {coupons.map(c => (
        <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: 1, background: '#fff8f5', border: '2px dashed var(--primary)', borderRadius: 8, padding: '3px 12px', color: 'var(--primary)' }}>{c.code}</span>
              <span style={{ fontSize: '0.82rem', background: c.active ? '#dcfce7' : '#f3f4f6', color: c.active ? '#166534' : '#6b7280', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>
                {c.active ? '✅ Active' : '⏸️ Inactive'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
              {c.min_order > 0 && ` · Min order ₹${c.min_order}`}
              {' · '}{c.used_count}/{c.max_uses} uses
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => toggleActive(c.id, !c.active)}
              style={{ background: c.active ? '#fee2e2' : '#dcfce7', color: c.active ? '#991b1b' : '#166534', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              {c.active ? '⏸️ Pause' : '▶ Activate'}
            </button>
            <button onClick={() => deleteCoupon(c.id, c.code)}
              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
