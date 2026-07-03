'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLATFORM_NAME, PLATFORM_EMOJI } from '@/lib/config';

export default function GetStartedPage() {
  const [form,      setForm]      = useState({ name: '', kitchen: '', phone: '', email: '', plan: 'growth', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function field(e) { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); }

  function submit(e) {
    e.preventDefault();
    // Send via WhatsApp to platform owner
    const msg = encodeURIComponent(
      `🍛 New Kitchen Onboarding Request\n\n` +
      `👤 Name: ${form.name}\n` +
      `🏪 Kitchen: ${form.kitchen}\n` +
      `📞 Phone: ${form.phone}\n` +
      `📧 Email: ${form.email}\n` +
      `📦 Plan: ${form.plan}\n` +
      `💬 Message: ${form.message || 'None'}`
    );
    const ownerPhone = process.env.NEXT_PUBLIC_OWNER_PHONE || '';
    if (ownerPhone) {
      window.open(`https://wa.me/${ownerPhone}?text=${msg}`, '_blank');
    }
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 10 }}>Request Received!</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
          We'll contact you within 24 hours to set up your kitchen on the platform.
        </p>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 700 }}>← Back to Home</Link>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px' }}>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>{PLATFORM_EMOJI}</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 8 }}>Get Started with {PLATFORM_NAME}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
          Fill in your details — we'll set up your kitchen and send you the login credentials.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: 'var(--shadow)' }}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>YOUR NAME *</label>
            <input name="name" value={form.name} onChange={field} placeholder="Ravi Kumar" required />
          </div>
          <div className="form-group">
            <label>KITCHEN / BUSINESS NAME *</label>
            <input name="kitchen" value={form.kitchen} onChange={field} placeholder="Ravi's Biryani House" required />
          </div>
          <div className="form-group">
            <label>WHATSAPP NUMBER *</label>
            <input name="phone" value={form.phone} onChange={field} placeholder="+91 9876543210" type="tel" required />
          </div>
          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input name="email" value={form.email} onChange={field} placeholder="ravi@example.com" type="email" />
          </div>

          <div className="form-group">
            <label>INTERESTED PLAN</label>
            <select name="plan" value={form.plan} onChange={field} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff' }}>
              <option value="starter">Starter — Free</option>
              <option value="growth">Growth — ₹999/month</option>
              <option value="pro">Pro — ₹2,499/month</option>
            </select>
          </div>

          <div className="form-group">
            <label>ANYTHING ELSE? (optional)</label>
            <textarea name="message" value={form.message} onChange={field} rows={3} placeholder="Tell us about your kitchen, cuisine type, expected order volume…" />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
            📩 Send Request
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--muted)' }}>
          We typically respond within a few hours on WhatsApp.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/pricing" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>← Compare all plans</Link>
      </div>
    </div>
  );
}
