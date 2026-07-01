'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImageUpload from '@/components/ImageUpload';

export default function AdminBrandingPage() {
  const { profile } = useAuth();
  const [form,    setForm]    = useState({ name: '', tagline: '', upi_id: '', phone: '', address: '' });
  const [logoUrl,   setLogoUrl]   = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!profile?.kitchens) return;
    const k = profile.kitchens;
    setForm({ name: k.name || '', tagline: k.tagline || '', upi_id: k.upi_id || '', phone: k.phone || '', address: k.address || '' });
    setLogoUrl(k.logo_url   || '');
    setBannerUrl(k.banner_url || '');
  }, [profile]);

  function field(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function save() {
    if (!profile?.kitchen_id) return;
    setSaving(true);
    await getSupabase().from('kitchens').update({ ...form, logo_url: logoUrl, banner_url: bannerUrl }).eq('id', profile.kitchen_id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="admin-page" style={{ maxWidth: 640 }}>
      <div className="admin-hero"><h2>🎨 Branding &amp; Settings</h2><p>Update your kitchen name, logo, UPI, and contact details</p></div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)' }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Kitchen Logo</div>
        <ImageUpload bucket="branding" currentUrl={logoUrl} onUpload={setLogoUrl} label="Upload Logo" />

        <div className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Banner Image</div>
        <ImageUpload bucket="branding" currentUrl={bannerUrl} onUpload={setBannerUrl} label="Upload Banner" />

        <div className="divider" />
        <div className="form-group"><label>KITCHEN NAME</label>
          <input name="name" value={form.name} onChange={field} placeholder="SpiceFest" />
        </div>
        <div className="form-group"><label>TAGLINE</label>
          <input name="tagline" value={form.tagline} onChange={field} placeholder="Authentic Indian Catering for Your Parties" />
        </div>

        <div className="divider" />
        <div className="form-group"><label>UPI ID (for GPay QR)</label>
          <input name="upi_id" value={form.upi_id} onChange={field} placeholder="spicefest@okaxis" />
        </div>
        <div className="form-group"><label>WHATSAPP / PHONE</label>
          <input name="phone" value={form.phone} onChange={field} placeholder="+91 9876543210" type="tel" />
        </div>
        <div className="form-group"><label>KITCHEN ADDRESS</label>
          <textarea name="address" value={form.address} onChange={field} rows={2} placeholder="Plot 12, HITEC City, Hyderabad" />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}
