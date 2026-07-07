'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const BLANK_KITCHEN = { name: '', slug: '', tagline: '', upi_id: '', phone: '', address: '', plan: 'starter' };
const BLANK_ADMIN   = { name: '', email: '', password: '' };

export default function SuperAdminPage() {
  const [kitchens,     setKitchens]     = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [kitchenForm,  setKitchenForm]  = useState(BLANK_KITCHEN);
  const [adminForm,    setAdminForm]    = useState(BLANK_ADMIN);
  const [saving,       setSaving]       = useState(false);
  const [message,      setMessage]      = useState('');
  const [editId,       setEditId]       = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [leads,        setLeads]        = useState([]);
  const [newLeadPopup, setNewLeadPopup] = useState(null); // latest incoming lead for popup

  function loadLeads() {
    getSupabase().from('leads').select('*').eq('status','new').order('created_at', { ascending: false })
      .then(({ data }) => setLeads(data || []));
  }

  useEffect(() => {
    loadKitchens();
    loadLeads();

    // Real-time: show popup when a new lead arrives
    const channel = getSupabase()
      .channel('superadmin-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        setNewLeadPopup(payload.new);  // trigger popup
        loadLeads();                   // refresh lead count
      })
      .subscribe();

    return () => getSupabase().removeChannel(channel);
  }, []);

  async function loadKitchens() {
    const { data } = await getSupabase().from('kitchens').select('*').order('created_at', { ascending: false });
    setKitchens(data || []);
  }

  function kField(e) { setKitchenForm((p) => ({ ...p, [e.target.name]: e.target.value })); }
  function aField(e) { setAdminForm((p) =>   ({ ...p, [e.target.name]: e.target.value })); }

  async function onboard() {
    const { name, slug, upi_id, phone } = kitchenForm;
    const { email, password } = adminForm;
    if (!name || !slug || !email || !password) { alert('Fill all required fields'); return; }
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    setSaving(true); setMessage('');

    const supabase = getSupabase();

    // 1. Insert kitchen
    const { data: kitchen, error: kErr } = await supabase
      .from('kitchens').insert({ ...kitchenForm, active: true }).select().single();
    if (kErr) { setMessage('❌ Kitchen error: ' + kErr.message); setSaving(false); return; }

    // 2. Create admin user via secure server API (requires service role key)
    const res  = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: adminForm.name, kitchen_id: kitchen.id }),
    });
    const result = await res.json();
    if (!res.ok) { setMessage('❌ Admin user error: ' + result.error); setSaving(false); return; }

    setMessage(`✅ "${name}" onboarded! Admin: ${email}`);

    // Auto-open WhatsApp to share credentials with the new admin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const waMsg   = encodeURIComponent(
      `🎉 Your kitchen *${name}* is now live!\n\n` +
      `🍽️ Menu: ${siteUrl}/${slug}\n` +
      `🔐 Admin login: ${siteUrl}/login\n` +
      `📧 Email: ${email}\n` +
      `🔑 Password: ${password}\n\n` +
      `You can log in and start adding your menu items right away. 🚀`
    );
    window.open(`https://wa.me/?text=${waMsg}`, '_blank');

    setKitchenForm(BLANK_KITCHEN); setAdminForm(BLANK_ADMIN); setShowForm(false);
    loadKitchens(); setSaving(false);
  }

  async function toggleActive(id, current) {
    await getSupabase().from('kitchens').update({ active: !current }).eq('id', id);
    loadKitchens();
  }

  function startEdit(k) {
    setEditId(k.id);
    setEditForm({ name: k.name, slug: k.slug, tagline: k.tagline || '', phone: k.phone || '', upi_id: k.upi_id || '', address: k.address || '', plan: k.plan || 'starter' });
  }

  async function saveEdit(id) {
    await getSupabase().from('kitchens').update(editForm).eq('id', id);
    setEditId(null);
    loadKitchens();
  }

  async function deleteKitchen(id, name) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    await getSupabase().from('kitchens').delete().eq('id', id);
    loadKitchens();
  }

  return (
    <div>

      {/* LIVE NEW LEAD POPUP */}
      {newLeadPopup && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: '#fff', borderRadius: 18, padding: '20px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxWidth: 340,
          border: '2px solid var(--primary)', animation: 'slideUp 0.4s ease',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>New Lead Received!</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14 }}>
            <b>{newLeadPopup.kitchen || newLeadPopup.name}</b> is interested in joining the platform.
            {newLeadPopup.plan && <span> Interested in <b>{newLeadPopup.plan}</b> plan.</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/superadmin/leads" style={{ flex: 1, textAlign: 'center', background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '9px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
              View Lead →
            </a>
            <button onClick={() => setNewLeadPopup(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="admin-hero" style={{ marginBottom: 24 }}>
        <h2>⚡ Platform Overview</h2>
        <p>Manage all cloud kitchens, onboard new partners, control access</p>
      </div>

      {/* New leads notification */}
      {leads.length > 0 && (
        <a href="/superadmin/leads" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1.5px solid #fed7aa', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.95rem' }}>
                🔔 {leads.length} new lead{leads.length > 1 ? 's' : ''} waiting!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: 2 }}>
                {leads[0].kitchen} ({leads[0].name}) just submitted an onboarding request.
                {leads.length > 1 ? ` +${leads.length - 1} more.` : ''}
              </div>
            </div>
            <span style={{ background: '#c2410c', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>View Leads →</span>
          </div>
        </a>
      )}

      <div className="admin-stats" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{kitchens.length}</div><div className="stat-lbl">Total Kitchens</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{kitchens.filter((k) => k.active).length}</div><div className="stat-lbl">Active</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--red)' }}>{kitchens.filter((k) => !k.active).length}</div><div className="stat-lbl">Inactive</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#f59e0b' }}>{leads.length}</div><div className="stat-lbl">New Leads</div></div>
      </div>

      {message && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontWeight: 600, color: 'var(--green)' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>All Kitchens</div>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Onboard New Kitchen'}
        </button>
      </div>

      {/* ONBOARDING FORM */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24, border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20 }}>New Kitchen + Admin Setup</h3>

          <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Kitchen Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div className="form-group"><label>KITCHEN NAME *</label><input name="name" value={kitchenForm.name} onChange={kField} placeholder="BiryaniBox" /></div>
            <div className="form-group"><label>SLUG * (URL key)</label><input name="slug" value={kitchenForm.slug} onChange={kField} placeholder="biryanibox" /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>TAGLINE</label><input name="tagline" value={kitchenForm.tagline} onChange={kField} placeholder="Best Biryani in Town" /></div>
            <div className="form-group"><label>UPI ID</label><input name="upi_id" value={kitchenForm.upi_id} onChange={kField} placeholder="biryanibox@okaxis" /></div>
            <div className="form-group"><label>PHONE</label><input name="phone" value={kitchenForm.phone} onChange={kField} placeholder="+91 9999999999" type="tel" /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>ADDRESS</label><input name="address" value={kitchenForm.address} onChange={kField} placeholder="Gachibowli, Hyderabad" /></div>
            <div className="form-group"><label>PLAN</label>
              <select name="plan" value={kitchenForm.plan} onChange={kField} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                <option value="starter">Starter (Free)</option>
                <option value="growth">Growth (₹999/mo)</option>
                <option value="pro">Pro (₹2,499/mo)</option>
              </select>
            </div>
          </div>

          <div className="divider" />
          <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>Admin User Credentials</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>ADMIN NAME</label><input name="name" value={adminForm.name} onChange={aField} placeholder="Ravi Kumar" /></div>
            <div className="form-group"><label>ADMIN EMAIL *</label><input name="email" type="email" value={adminForm.email} onChange={aField} placeholder="admin@biryanibox.com" /></div>
            <div className="form-group"><label>TEMP PASSWORD *</label><input name="password" type="password" value={adminForm.password} onChange={aField} placeholder="Min 8 characters" /></div>
          </div>

          <div className="info-box" style={{ marginTop: 12 }}>
            ℹ️ The admin user will receive login credentials at the email above. They should change their password after first login.
          </div>

          <button className="btn-primary" style={{ marginTop: 16 }} onClick={onboard} disabled={saving}>
            {saving ? 'Setting up…' : '🚀 Onboard Kitchen'}
          </button>
        </div>
      )}

      {/* KITCHEN LIST */}
      {kitchens.map((k) => (
        <div key={k.id} className="order-card">
          {editId === k.id ? (
            /* ── EDIT MODE ── */
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>✏️ Edit Kitchen</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group"><label>NAME</label><input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="form-group"><label>SLUG</label><input value={editForm.slug} onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))} /></div>
                <div className="form-group"><label>PHONE</label><input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="form-group"><label>UPI ID</label><input value={editForm.upi_id} onChange={(e) => setEditForm((p) => ({ ...p, upi_id: e.target.value }))} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label>TAGLINE</label><input value={editForm.tagline} onChange={(e) => setEditForm((p) => ({ ...p, tagline: e.target.value }))} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label>ADDRESS</label><input value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} /></div>
              <div className="form-group"><label>PLAN</label>
                <select value={editForm.plan || 'starter'} onChange={(e) => setEditForm((p) => ({ ...p, plan: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)' }}>
                  <option value="starter">Starter (Free)</option>
                  <option value="growth">Growth (₹999/mo)</option>
                  <option value="pro">Pro (₹2,499/mo)</option>
                </select>
              </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="action-btn accept" onClick={() => saveEdit(k.id)}>💾 Save</button>
                <button className="action-btn" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <>
              <div className="order-top">
                <div>
                  <h4>🍳 {k.name}</h4>
                  <small>🔗 /{k.slug} &nbsp;|&nbsp; 📞 {k.phone || 'N/A'} &nbsp;|&nbsp; 💳 {k.upi_id || 'Not set'}</small>
                  {k.tagline && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>{k.tagline}</div>}
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: k.plan === 'pro' ? '#ede9fe' : k.plan === 'growth' ? '#fff7ed' : '#f3f4f6',
                      color: k.plan === 'pro' ? '#7c3aed' : k.plan === 'growth' ? '#c2410c' : '#6b7280',
                    }}>
                      {k.plan === 'pro' ? '⭐ Pro' : k.plan === 'growth' ? '🔥 Growth' : '🆓 Starter'}
                    </span>
                  </div>
                </div>
                <span className={`badge ${k.active ? 'badge-delivered' : 'badge-new'}`}>
                  {k.active ? '✅ Active' : '⏸️ Inactive'}
                </span>
              </div>
              <div className="order-actions" style={{ marginTop: 12 }}>
                <a href={`/${k.slug}`} target="_blank" rel="noreferrer" className="action-btn accept">👁️ View Menu</a>
                <button className="action-btn" style={{ background: k.active ? '#fee2e2' : '#dcfce7', color: k.active ? '#991b1b' : '#166534' }} onClick={() => toggleActive(k.id, k.active)}>
                  {k.active ? '⏸️ Deactivate' : '▶ Activate'}
                </button>
                <button className="action-btn" style={{ background: '#fef9c3', color: '#854d0e' }} onClick={() => startEdit(k)}>✏️ Edit</button>
                <button className="action-btn" style={{ background: '#fee2e2', color: '#991b1b', marginLeft: 'auto' }} onClick={() => deleteKitchen(k.id, k.name)}>🗑️ Delete</button>
              </div>
            </>
          )}
        </div>
      ))}

      {!kitchens.length && <div className="empty-state"><div className="ico">🏪</div><p>No kitchens onboarded yet. Click "Onboard New Kitchen" to start.</p></div>}
    </div>
  );
}
