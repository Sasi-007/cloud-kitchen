import Link from 'next/link';

export const metadata = {
  title: 'Pricing Plans — SpiceFest Cloud Kitchen Platform',
  description: 'Simple, transparent pricing for cloud kitchens. Start free on the Starter plan and upgrade as you grow. No hidden fees.',
  openGraph: { title: 'Pricing — SpiceFest', description: 'Free and paid plans for cloud kitchen ordering.' },
};

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever free',
    color: '#6b7280',
    features: [
      '1 kitchen',
      'Up to 100 orders/month',
      'Menu management',
      'COD payments',
      'Order tracking page',
      'WhatsApp order link',
    ],
    missing: ['GPay / UPI QR', 'Analytics dashboard', 'Customer feedback', 'Custom branding', 'Priority support'],
    cta: 'Get Started Free',
    href: '/get-started?plan=starter',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹999',
    sub: 'per month',
    color: '#ff6b35',
    features: [
      '1 kitchen',
      'Unlimited orders',
      'Menu management',
      'COD + GPay / UPI QR',
      'Order tracking page',
      'WhatsApp notifications',
      'Analytics dashboard',
      'Customer feedback & ratings',
      'Custom branding (logo, banner)',
    ],
    missing: ['Priority support'],
    cta: 'Get Started — ₹999/mo',
    href: '/get-started?plan=growth',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹2,499',
    sub: 'per month',
    color: '#8b5cf6',
    features: [
      'Up to 5 kitchens',
      'Unlimited orders',
      'Everything in Growth',
      'Advanced analytics',
      'Feedback insights & trends',
      'Soft delete & order recovery',
      'Priority support',
      'Custom domain support',
    ],
    missing: [],
    cta: 'Contact Us',
    href: '/get-started?plan=pro',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '64px 20px 40px', background: '#fff8f5' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 10 }}>Simple, transparent pricing</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
          Start free and scale as your kitchen grows. No hidden fees.
        </p>
      </section>

      {/* PLANS */}
      <section style={{ padding: '40px 20px 72px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              background: '#fff', borderRadius: 20, padding: '32px 28px',
              boxShadow: plan.highlight ? '0 8px 40px rgba(255,107,53,0.18)' : '0 2px 16px rgba(0,0,0,0.07)',
              border: plan.highlight ? '2px solid var(--primary)' : '1.5px solid #f0f0f0',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', borderRadius: 30, padding: '4px 18px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  ⭐ Most Popular
                </div>
              )}

              <div style={{ color: plan.color, fontWeight: 800, fontSize: '1rem', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#111', lineHeight: 1 }}>{plan.price}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 24 }}>{plan.sub}</div>

              <Link href={plan.href} style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
                background: plan.highlight ? 'var(--primary)' : '#f5f5f5',
                color: plan.highlight ? '#fff' : '#333',
                borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: '0.95rem',
                marginBottom: 24,
              }}>
                {plan.cta} →
              </Link>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: '0.88rem' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, marginTop: 1 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: '0.88rem', opacity: 0.35 }}>
                    <span style={{ fontWeight: 700, marginTop: 1 }}>✕</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#fff8f5', padding: '60px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: 36 }}>Common questions</h2>
          {[
            { q: 'Can I switch plans later?', a: 'Yes — superadmin can change any kitchen\'s plan anytime from the platform dashboard.' },
            { q: 'What happens when I exceed the order limit on Starter?', a: 'Orders still go through. You\'ll be prompted to upgrade to Growth for unlimited orders.' },
            { q: 'Is there a setup fee?', a: 'No. The platform is onboarded by us, kitchen owners just receive their login credentials.' },
            { q: 'What payment methods do customers use?', a: 'COD on all plans. GPay/UPI QR available on Growth and Pro.' },
          ].map((item) => (
            <div key={item.q} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>Q: {item.q}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
