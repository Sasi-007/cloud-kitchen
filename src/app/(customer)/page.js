import Link from 'next/link';

const FEATURES = [
  { icon: '⚡', title: 'Real-time Orders', desc: 'Orders appear instantly on the admin dashboard. No refresh needed.' },
  { icon: '📱', title: 'WhatsApp Alerts', desc: 'Customers get notified via WhatsApp when their order is ready.' },
  { icon: '📊', title: 'Analytics', desc: 'Track revenue, top items, ratings and daily trends at a glance.' },
  { icon: '⭐', title: 'Customer Feedback', desc: 'Collect star ratings and comments after every delivery.' },
  { icon: '🔒', title: 'Full Data Isolation', desc: 'Each kitchen sees only their own orders, menus and customers.' },
  { icon: '🌐', title: 'SEO Ready', desc: 'Each kitchen gets its own URL, meta tags and Google-friendly schema.' },
];

const STEPS = [
  { n: '1', title: 'Superadmin onboards kitchen', desc: 'Fill a form — kitchen + admin account created in seconds.' },
  { n: '2', title: 'Admin sets up menu & branding', desc: 'Add items, upload logo, set UPI ID — all from a simple dashboard.' },
  { n: '3', title: 'Share the link, start taking orders', desc: 'yoursite.com/kitchenname — customers order, you cook, done.' },
];

const TRUST = [
  { icon: '🏪', stat: 'Multi-tenant', label: 'One platform, unlimited kitchens' },
  { icon: '🔐', stat: 'RLS secured', label: 'Row-level security on every table' },
  { icon: '💳', stat: 'COD + GPay', label: 'Flexible payment options' },
  { icon: '📦', stat: 'Bulk orders', label: 'Built for party & event catering' },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 50%, #ffb347 100%)',
        color: '#fff', textAlign: 'center', padding: '80px 20px 100px',
      }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 30, padding: '6px 18px', fontSize: '0.82rem', fontWeight: 700, marginBottom: 20, letterSpacing: 1 }}>
          🚀 Cloud Kitchen SaaS Platform
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
          Launch your Cloud Kitchen<br />in minutes, not months
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Accept bulk orders for parties & events. Real-time dashboard, WhatsApp notifications, analytics — all in one platform.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{
            background: '#fff', color: 'var(--primary)', borderRadius: 14, padding: '14px 28px',
            fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            Get Started Free →
          </Link>
          <Link href="/pricing" style={{
            background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 14, padding: '14px 28px',
            fontWeight: 700, fontSize: '1rem', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)'
          }}>
            View Pricing
          </Link>
        </div>
        <p style={{ marginTop: 18, opacity: 0.75, fontSize: '0.85rem' }}>No credit card required · Free plan available</p>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: '#fff8f5', borderBottom: '1px solid #ffe0d0', padding: '20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {TRUST.map((t) => (
            <div key={t.stat} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{t.stat}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '72px 20px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Everything you need to run your kitchen</h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Built for cloud kitchens that take bulk party & event orders</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f5f5f5' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#fff8f5', padding: '72px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>How it works</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 48 }}>Three steps from signup to first order</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'left' }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ minWidth: 40, height: 40, background: 'var(--primary)', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Ready to take your first order?</h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 32, fontSize: '1rem' }}>Join cloud kitchens already using the platform</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ background: 'var(--primary)', color: '#fff', borderRadius: 14, padding: '14px 32px', fontWeight: 800, fontSize: '1rem', textDecoration: 'none' }}>
            Start for Free →
          </Link>
          <Link href="/pricing" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 14, padding: '14px 32px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            See Pricing
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#111', color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '24px 20px', fontSize: '0.82rem' }}>
        © {new Date().getFullYear()} CloudKitchen Platform · <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.5)' }}>Pricing</Link> · <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Login</Link>
      </footer>

    </div>
  );
}
