'use client';

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AdminPasswordPage() {
    const [form, setForm] = useState({ current: '', newPass: '', confirm: ''});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function changePassword(e) {
        e.preventDefault();
        setMessage('');setError('');
        if(form.newPass.length < 8) { setError('New password must be at least 8 characters'); return; }
        if(form.newPass !== form.confirm) { setError('Passwords do not match'); return; }
        setSaving(true);

        const { error: err } = await getSupabase().auth.updateUser({ password: form.newPass });
        if (err) { setError(err.message); }
        else { setError('✅ Password changed successfully!'); setForm({ current: '', newPass: '', confirm: ''}); }
        setSaving(false);
    }

    return (
        <div className="admin-page" style={{ maxWidth: 480 }}>
            <div className="admin-hero">
                <h2>🔐 Change password</h2>
                <p>Update your admin account password</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.82rem', color: '#1e40af' }}>
                    ℹ️ Default password is <b>Admin@123</b>. Change it to something you'll remember.
                </div>
                <form onSubmit={changePassword}>
                    <div className="form-group">
                        <label>NEW PASSWORD *</label>
                        <input type="password" value={form.newPass} onChange={(e) => setForm(p => ({...p, newPass: e.target.value}))} placeholder="Min 8 characters" required />
                    </div>
                    <div className="form-group">
                        <label>CONFIRM NEW PASSWORD *</label>
                        <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({...p, confirm: e.target.value}))} placeholder="Re-enter new password" required />
                    </div>
                    {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600 }}>❌ {error}</div>}
                    {message && <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600 }}>{message}</div>}
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : '🔐 Change Password'}</button>
                </form>
            </div>
        </div>
    );
}