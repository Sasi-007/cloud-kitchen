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

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>Loading menu…</div>;
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
{/* 
          <a href={`/${slug}/orders`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)',
            color: '#fff', borderRadius: 30, padding: '8px 18px', fontSize: '0.85rem',
            fontWeight: 600, textDecoration: 'none',
          }}>
            📋 Already ordered? Track your order
          </a> */}
          <div className="hero-actions">
            <a href={`/${slug}/orders`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)', color: '#fff', borderRadius: 30, padding: '8px 16px', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none',
            }}>📋 Track my order</a>
            {kitchen?.phone && (
              <a href={`https://wa.me/${kitchen.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi! I need a custom order from ${kitchen.name}. Can you help?`)}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.45)', color: '#fff', borderRadius: 30, padding: '8px 16px', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none',
              }}>📝 Custom Order?</a>
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
