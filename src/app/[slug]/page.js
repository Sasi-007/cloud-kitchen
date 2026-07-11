'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const CATEGORIES_ALL = 'All';

export default function KitchenMenuPage({ params }) {
  const { slug } = params;
  const [kitchen,    setKitchen]    = useState(null);
  const [menuItems,  setMenuItems]  = useState([]);
  const [cart,       setCart]       = useState({});
  const [activeCat,  setActiveCat]  = useState(CATEGORIES_ALL);
  const [partySize,  setPartySize]  = useState(10);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [reviews,    setReviews]    = useState([]);
  const [allRatings, setAllRatings] = useState([]); // all ratings for aggregate

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: k } = await supabase.from('kitchens').select('*').eq('slug', slug).single();
      if (!k) { setNotFound(true); setLoading(false); return; }
      setKitchen(k);

      const { data: items } = await supabase
        .from('menu_items').select('*')
        .eq('kitchen_id', k.id).eq('active', true)
        .order('category').order('sort_order');
      setMenuItems(items || []);

      // Load approved reviews — respects admin's max_reviews_shown setting
      const limit = k.max_reviews_shown || 6;
      const { data: rev } = await supabase.from('feedback')
        .select('rating,comment,tags,is_manual,manual_note')
        .eq('kitchen_id', k.id).eq('visible_to_customer', true)
        .order('created_at', { ascending: false }).limit(limit);
      setReviews(rev || []);
      // All ratings for aggregate score (independent of visibility)
      const { data: allRev } = await supabase.from('feedback')
        .select('rating').eq('kitchen_id', k.id);
      setAllRatings((allRev || []).map(r => r.rating));

      try {
        const saved = JSON.parse(localStorage.getItem(`ck_cart_${slug}`) || '{}');
        setCart(saved);
      } catch {}
      setLoading(false);
    }
    load();
  }, [slug]);

  function saveCart(newCart) {
    setCart(newCart);
    localStorage.setItem(`ck_cart_${slug}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  }

  function addItem(item) {
    saveCart({ ...cart, [item.id]: { ...item, qty: (cart[item.id]?.qty || 0) + 1 } });
  }

  function updateQty(id, delta) {
    const qty = (cart[id]?.qty || 0) + delta;
    const next = { ...cart };
    if (qty <= 0) delete next[id]; else next[id] = { ...cart[id], qty };
    saveCart(next);
  }

  const categories = [CATEGORIES_ALL, ...new Set(menuItems.map((i) => i.cat || i.category))];
  const filtered   = activeCat === CATEGORIES_ALL ? menuItems : menuItems.filter((i) => (i.cat || i.category) === activeCat);

  if (loading) return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)', borderRadius: 14, padding: '36px 28px', marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.2)', marginBottom: 12}} />
        <div style={{ height: 28, width: '55%', borderRadius: 8, background: 'rgba(255,255,255,0.25)', marginBottom: 10}} />
        <div style={{ height: 16, width: '70%', borderRadius: 8, background: 'rgba(255,255,255,0.18)'}} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[80,60,90,70].map((w,i) => <div key={i} style={{ height: 34, width: w, borderRadius: 20, background: '#e5e7eb', animation: 'shimmer 1.4s infinite', backgroundSize: '200%'}}/>)}
      </div>
      <div className="menu-grid">
        {[1,2,3,4,5,6].map(i=> (
          <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{ height: 140, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}} />
            <div style={{ padding: 14 }}>
              <div style={{ height: 16, width: '70%', borderRadius: 6, background: '#e5e7eb', marginBottom: 8}} />
              <div style={{ height: 12, width: '90%', borderRadius: 6, background: '#f0f0f0', marginBottom: 12}} />
              <div style={{ height: 20, width: '40%', borderRadius: 6, background: '#e5e7eb'}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (notFound) return <div className="page empty-state"><div className="ico">🔍</div><p>Kitchen not found</p></div>;

  return (
    <div className="page">
      {/* HERO — uses kitchen banner if available */}
      <div className="hero" style={kitchen?.banner_url ? {
        backgroundImage: `url(${kitchen.banner_url})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative',
      } : {}}>
        {kitchen?.banner_url && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 'inherit' }} />}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {kitchen?.logo_url && (
            <img src={kitchen.logo_url} alt={kitchen.name}
              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 16, marginBottom: 12, background: '#fff', padding: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            />
          )}
          <h1>{kitchen?.name || 'Order for Your Party 🎉'}</h1>
          <p>{kitchen?.tagline || 'Bulk catering for gatherings & events'}</p>

          {/* Party size — full width row */}
          <div className="party-selector">
            <label>👥 Party Size:</label>
            <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
              {[1, 5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>{n === 1 ? '1–5 People' : `${n} People`}</option>
              ))}
            </select>
            <span className="party-badge">
              Min ₹{(partySize * 100).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Action links — below party selector */}
          <div className="hero-actions">
            <a href={`/${slug}/orders`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
              color: '#fff', borderRadius: 30, padding: '8px 16px', fontSize: '0.83rem',
              fontWeight: 600, textDecoration: 'none',
            }}>
              📋 Track my order
            </a>
            {kitchen?.phone && (
              <a
                href={`/${slug}/custom-order`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
                  color: '#fff', borderRadius: 30, padding: '8px 16px', fontSize: '0.83rem',
                  fontWeight: 600, textDecoration: 'none',
                }}
              >
                📝 Custom Order?
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="cat-tabs">
        {categories.map((cat) => (
          <button key={cat} className={`cat-tab ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* MENU */}
      <div className="menu-grid">
        {filtered.map((item) => {
          const inCart = cart[item.id];
          return (
            <div key={item.id} className="menu-card">
              <div className="menu-emoji">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : item.emoji || '🍽️'}
              </div>
              <div className="menu-info">
                <div className="menu-meta">
                  <h3>{item.name}</h3>
                  {item.popular && <span className="tag">🔥 Popular</span>}
                  <span className={`tag ${item.veg ? 'veg' : ''}`}>{item.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                </div>
                <p className="menu-desc">{item.description}</p>
                <div className="menu-footer">
                  <div>
                    <div className="menu-price">₹{item.price}</div>
                    {item.price_per_person && <div className="menu-pprice">₹{item.price_per_person}/person</div>}
                  </div>
                  {inCart ? (
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{inCart.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" onClick={() => addItem(item)}>Add +</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!filtered.length && <div className="empty-state"><div className="ico">🍽️</div><p>No items in this category yet.</p></div>}

      {/* ── REVIEWS SECTION ─────────────────────────────── */}
      {(reviews.length > 0 || allRatings.length > 0) && (() => {
        const avg       = allRatings.length ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length) : 0;
        const rounded   = Math.round(avg * 10) / 10;
        const breakdown = [5,4,3,2,1].map(n => ({ n, count: allRatings.filter(r => r === n).length }));

        return (
          <div style={{ marginTop: 40, marginBottom: 8 }}>
            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Customer Reviews
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>What our customers say</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Real feedback from real orders</p>
            </div>

            {/* Overall rating summary */}
            {allRatings.length >= 3 && (
              <div style={{
                background: 'linear-gradient(135deg, #fff8f5, #fff)',
                border: '1.5px solid #ffcbb0', borderRadius: 20,
                padding: '24px 28px', marginBottom: 24,
                display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap',
              }}>
                {/* Big score */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{rounded}</div>
                  <div style={{ fontSize: '1.2rem', marginTop: 4 }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ color: n <= Math.round(avg) ? '#f59e0b' : '#e5e7eb' }}>★</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                    {allRatings.length} review{allRatings.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Breakdown bars */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  {breakdown.map(({ n, count }) => {
                    const pct = allRatings.length ? Math.round((count / allRatings.length) * 100) : 0;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', width: 8, textAlign: 'right' }}>{n}</span>
                        <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>★</span>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: n >= 4 ? '#f59e0b' : n === 3 ? '#fb923c' : '#ef4444', borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', width: 28, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review cards */}
            {reviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
                {reviews.map((r, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 16, padding: '18px 20px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #f5f5f5',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Decorative quote */}
                    <div style={{ position: 'absolute', top: 10, right: 14, fontSize: '3rem', color: '#f0f0f0', fontFamily: 'Georgia, serif', lineHeight: 1, userSelect: 'none' }}>"</div>

                    {/* Stars */}
                    <div style={{ marginBottom: 8 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ color: n <= r.rating ? '#f59e0b' : '#e5e7eb', fontSize: '0.95rem' }}>★</span>
                      ))}
                    </div>

                    {/* Comment */}
                    {r.comment && (
                      <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                        "{r.comment}"
                      </p>
                    )}

                    {/* Tags */}
                    {r.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {r.tags.map((t, ti) => (
                          <span key={ti} style={{ fontSize: '0.7rem', fontWeight: 600, background: '#fff8f5', color: 'var(--primary)', borderRadius: 20, padding: '2px 10px', border: '1px solid #ffcbb0' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                      ✅ Verified Customer
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* CONTACT KITCHEN FOOTER */}
      {(kitchen?.phone || kitchen?.address) && (
        <div style={{ marginTop: 32, borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>{kitchen.name}</div>
              {kitchen.address && (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span>📍</span><span>{kitchen.address}</span>
                </div>
              )}
              {kitchen.phone && (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4, display: 'flex', gap: 6 }}>
                  <span>📞</span>
                  <a href={`tel:${kitchen.phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{kitchen.phone}</a>
                </div>
              )}
            </div>
            {kitchen.phone && (
              <a
                href={`https://wa.me/${kitchen.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi! I have a question about ordering from ${kitchen.name}.`)}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25d366', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 2px 12px rgba(37,211,102,0.25)' }}
              >
                <span style={{ fontSize: '1.1rem' }}>📱</span> Contact Kitchen
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
