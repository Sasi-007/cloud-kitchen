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
      {/* HERO */}
      <div className="hero">
        <h1>Order for Your Party 🎉</h1>
        <p>{kitchen?.tagline || 'Bulk catering for gatherings & events'}</p>
        {/* <div style={{ marginTop: 14}}>
          <a href={`/${slug}/orders`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)',
            color: '#fff', borderRadius: 30, padding: '8px 18px', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none', backdropFilter: 'blur(4px)'
          }}>
            📋 Already ordered? Track your order
          </a>
        </div>
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
        </div> */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 18,
            marginTop: 18,
          }}
        >
          <a
            href={`/${slug}/orders`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.5)',
              color: '#fff',
              borderRadius: 30,
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
              backdropFilter: 'blur(4px)',
            }}
          >
            📋 Already ordered? Track your order
          </a>

          <div className="party-selector">
            <label>👥 Party Size:</label>

            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
            >
              {[1, 5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? '1–5 People' : `${n} People`}
                </option>
              ))}
            </select>

            <span className="party-badge">
              Min ₹{(partySize * 100).toLocaleString('en-IN')}
            </span>
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
    </div>
  );
}
