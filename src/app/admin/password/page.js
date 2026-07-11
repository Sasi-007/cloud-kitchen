'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function AdminPasswordPage() {
  const [form,    setForm]    = useState({ newPass: '', confirm: '' });
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const [changed, setChanged] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setMessage(''); setError('');
    if (form.newPass.length < 8)      { setError('New password must be at least 8 characters'); return; }
    if (form.newPass !== form.confirm) { setError('Passwords do not match'); return; }
    setSaving(true);

    const { error: err } = await getSupabase().auth.updateUser({ password: form.newPass });
    if (err) { setError(err.message); }
    else     { setMessage('✅ Password changed successfully!'); setForm({ newPass: '', confirm: '' }); setChanged(true); }
    setSaving(false);
  }

  return (
    <div className="admin-page" style={{ maxWidth: 480 }}>
      <div className="admin-hero">
        <h2>🔐 Change Password</h2>
        <p>Update your admin account password</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: 'var(--shadow)' }}>

        {/* Only show default-password hint if not yet changed */}
        {!changed && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem', color: '#1e40af' }}>
            ℹ️ Your default password is <b>Admin@123</b>. We recommend changing it now.
          </div>
        )}

        {/* Success state */}
        {changed ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 6, color: 'var(--green)' }}>Password Changed!</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 20 }}>Your new password is active. Use it next time you log in.</div>
            <button onClick={() => setChanged(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Change Again
            </button>
          </div>
        ) : (
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>NEW PASSWORD *</label>
              <input type="password" value={form.newPass} onChange={(e) => setForm(p => ({...p, newPass: e.target.value}))}
                placeholder="Min 8 characters" required />
            </div>
            <div className="form-group">
              <label>CONFIRM NEW PASSWORD *</label>
              <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({...p, confirm: e.target.value}))}
                placeholder="Re-enter new password" required />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600 }}>❌ {error}</div>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Changing…' : '🔐 Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
