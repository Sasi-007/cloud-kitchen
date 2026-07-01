export default function LandingPage() {

  return (
    <div className="page">
      <div className="hero" style={{ textAlign: 'center', maxWidth: 500, margin: '80px auto 0' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🍛</div>
        <h1 style={{ fontSize: '1.8rem' }}>Cloud Kitchen Platform</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Use the direct link shared by your kitchen to place an order.</p>
        <div style={{marginTop:28,background:'#fff8f5',border:'1.5px solid #ffcbb0',borderRadius: 14,padding: '18px 20px', textAlign: 'left', fontSize: '0.9rem'}}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Example:</div>
          <code style={{ color: 'var(--primary)' }}>yoursite.com/<strong>kitchenname</strong></code>
          <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: '0.82rem' }}>Contact your kitchen for their ordering link.</div>
        </div>
      </div>
    </div>
  );
}
