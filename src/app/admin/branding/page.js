'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import Link from 'next/link';

export default function AdminBrandingPage() {
  const { profile } = useAuth();
  const [form,    setForm]    = useState({ name: '', tagline: '', upi_id: '', phone: '', address: '', delivery_fee: 50, free_delivery_above: 1000 });
  const [logoUrl,   setLogoUrl]   = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const plan = profile?.kitchens?.plan || 'starter';

  useEffect(() => {
    if (!profile?.kitchens) return;
    const k = profile.kitchens;
    setForm({ name: k.name || '', tagline: k.tagline || '', upi_id: k.upi_id || '', phone: k.phone || '', address: k.address || '',
      delivery_fee: k.delivery_fee ?? 50, free_delivery_above: k.free_delivery_above ?? 1000 });
    setLogoUrl(k.logo_url   || '');
    setBannerUrl(k.banner_url || '');
  }, [profile]);

  function field(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  async function save() {
    if (!profile?.kitchen_id) return;
    setSaving(true); setSaveErr('');
    // Only send columns that definitely exist — exclude delivery columns until migration is run
    const update = { name: form.name, tagline: form.tagline, upi_id: form.upi_id, phone: form.phone, address: form.address, logo_url: logoUrl, banner_url: bannerUrl };
    // Try adding delivery columns — if migration not run, they'll be ignored
    try { update.delivery_fee = Number(form.delivery_fee) || 50; } catch {}
    try { update.free_delivery_above = Number(form.free_delivery_above) || 1000; } catch {}

    const { error, count } = await getSupabase().from('kitchens')
      .update(update, { count: 'exact' }).eq('id', profile.kitchen_id);
    if (error) {
      // If delivery columns don't exist yet, save without them
      if (error.message?.includes('delivery_fee') || error.message?.includes('free_delivery_above')) {
        const { error: e2 } = await getSupabase().from('kitchens').update({
          name: form.name, tagline: form.tagline, upi_id: form.upi_id,
          phone: form.phone, address: form.address, logo_url: logoUrl, banner_url: bannerUrl,
        }).eq('id', profile.kitchen_id);
        if (e2) { setSaveErr('Save failed: ' + e2.message); setSaving(false); return; }
        setSaveErr('⚠️ Saved (without delivery settings — run migrations_2026_07_10.sql to enable them)');
      } else {
        setSaveErr('Save failed: ' + error.message);
        setSaving(false); return;
      }
    } else if (count === 0) {
      setSaveErr('Save failed: No permission to update — run this SQL in Supabase:\ncreate policy "Admin updates own kitchen" on kitchens for update using (exists (select 1 from profiles where id = auth.uid() and kitchen_id = kitchens.id));');
      setSaving(false); return;
    }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setSaveErr(''); }, 4000);
  }

  return (
    <div className="admin-page" style={{ maxWidth: 640 }}>
      <div className="admin-hero"><h2>🎨 Branding &amp; Settings</h2><p>Update your kitchen name, logo, UPI, and contact details</p></div>

      {/* Upgrade banner for starter plan */}
      {plan === 'starter' && (
        <div style={{ background: '#fef9c3', border: '1.5px solid #fde047', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔒 Logo &amp; Banner upload — Growth feature</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: 2 }}>Upgrade to add your logo, banner and custom branding.</div>
          </div>
          <Link href="/pricing" style={{ background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* SHARE YOUR MENU — WhatsApp + copy link */}
      {profile?.kitchens?.slug && (() => {
        const menuUrl  = `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.kitchens.slug}`;
        const waText   = encodeURIComponent(`🍛 Order from ${profile.kitchens.name || 'our kitchen'}!\n\nBrowse menu & place your order here:\n${menuUrl}\n\nNo calls needed — order in 2 minutes 😊`);
        return (
          <div style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '1.5px solid #86efac', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>📤 Share Your Menu</div>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: 14 }}>
              Send this link to customers — they can browse &amp; order without calling you.
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--primary)', marginBottom: 14, wordBreak: 'break-all' }}>
              {menuUrl}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}
              >
                <span style={{ fontSize: '1.1rem' }}>📱</span> Share on WhatsApp
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(menuUrl); alert('Link copied!'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #86efac', color: '#166534', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        );
      })()}

      <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)' }}>
        {plan !== 'starter' && (
          <>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Kitchen Logo</div>
            <ImageUpload bucket="branding" currentUrl={logoUrl}
              stableKey={`kitchen_${profile?.kitchen_id}_logo`}
              onUpload={async (url) => { setLogoUrl(url); await getSupabase().from('kitchens').update({ logo_url: url }).eq('id', profile.kitchen_id); }}
              label="Upload Logo" />
            <div className="divider" />
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Banner Image</div>
            <ImageUpload bucket="branding" currentUrl={bannerUrl}
              stableKey={`kitchen_${profile?.kitchen_id}_banner`}
              onUpload={async (url) => { setBannerUrl(url); await getSupabase().from('kitchens').update({ banner_url: url }).eq('id', profile.kitchen_id); }}
              label="Upload Banner" />
            <div className="divider" />
          </>
        )}
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

        <div className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 14 }}>🚚 Delivery Settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div className="form-group">
            <label>DELIVERY FEE (₹)</label>
            <input name="delivery_fee" type="number" min="0" value={form.delivery_fee} onChange={field} placeholder="50" />
            <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Charged when order is below the free delivery threshold</small>
          </div>
          <div className="form-group">
            <label>FREE DELIVERY ABOVE (₹)</label>
            <input name="free_delivery_above" type="number" min="0" value={form.free_delivery_above} onChange={field} placeholder="1000" />
            <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Set 0 to always charge delivery fee</small>
          </div>
        </div>

        <button className="btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Changes'}
        </button>
        {saveErr && <div style={{ marginTop: 10, fontSize: '0.82rem', color: saveErr.startsWith('⚠️') ? '#854d0e' : 'var(--red)', background: saveErr.startsWith('⚠️') ? '#fef9c3' : '#fef2f2', borderRadius: 8, padding: '8px 12px' }}>{saveErr}</div>}
      </div>
    </div>
  );
}
