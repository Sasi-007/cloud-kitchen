'use client';

import { useState } from 'react';
import { MENU, CATEGORIES } from '@/data/menu';
import { useApp } from '@/context/AppContext';

export default function MenuPage() {
  const { cart, addItem, updateQty, partySize, setPartySize, showToast } = useApp();
  const [activeCat, setActiveCat] = useState('All');

  const filtered = activeCat === 'All' ? MENU : MENU.filter((i) => i.cat === activeCat);
  const minOrder = partySize * 100;

  function handleAdd(item) {
    addItem(item);
    showToast(`${item.name} added to cart`);
  }

  return (
    <div className="page">
      {/* HERO */}
      <div className="hero">
        <h1>Order for Your Party 🎉</h1>
        <p>Bulk catering for gatherings, parties &amp; corporate events</p>
        <div className="party-selector">
          <label>👥 Party Size:</label>
          <select
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          >
            {[1, 10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>{n === 1 ? '1–5 People' : `${n} People`}</option>
            ))}
          </select>
          <span className="party-badge">
            Serves {partySize} → Min ₹{minOrder.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="cat-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cat-tab ${activeCat === cat ? 'active' : ''}`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MENU GRID */}
      <div className="menu-grid">
        {filtered.map((item) => {
          const inCart = cart[item.id];
          return (
            <div key={item.id} className="menu-card">
              <div className="menu-emoji">{item.emoji}</div>
              <div className="menu-info">
                <div className="menu-meta">
                  <h3>{item.name}</h3>
                  {item.popular && <span className="tag">🔥 Popular</span>}
                  <span className={`tag ${item.veg ? 'veg' : ''}`}>
                    {item.veg ? '🟢 Veg' : '🔴 Non-Veg'}
                  </span>
                </div>
                <p className="menu-desc">{item.desc}</p>
                <div className="menu-footer">
                  <div>
                    <div className="menu-price">₹{item.price}</div>
                    <div className="menu-pprice">₹{item.pprice}/person</div>
                  </div>
                  {inCart ? (
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{inCart.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" onClick={() => handleAdd(item)}>Add +</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
