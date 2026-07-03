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

      {profile?.kitchens?.slug && (() => {
        const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.kitchens.slug}`;
        const waText = encodeURIComponent(`🍛 Order from ${profile.kitchens.name || 'our kitchen'}!\n\nBrowse menu & place your order here:\n${menuUrl}\n\nNo calls needed - order in 2 minutes 😊`);
        return(
          <div style={{ background: 'linear-gradient(135deg,#dcfce7, #bbf7d0)', border: '1.5px solid #86efac', borderRadius: 16, padding: '20px 24px', marginBottom: 24}}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>📥 Share Your Menu</div>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom:14 }}>
              Send this link to customers - they can browse &amp; order without calling you.
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--primary)', marginBottom: 14, wordBreak: 'break-all' }}>
              {menuUrl}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none'}}>
                <span style={{ fontSize: '1.1rem' }}>📱</span> Share on WhatsApp
              </a>
              <button onClick={() => { navigator.clipboard.writeText(menuUrl); alert('Link copied!'); }} style={{ display: 'inline-flex', alignItems: 'center', gap:8,background: '#fff', border: '1.5px solid #86efac', color: '#166534', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>📋 Copy Link</button>
            </div>
          </div>
        );
      })()}

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
