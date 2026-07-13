'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

// SEO is handled by [slug]/layout.js (generateMetadata) — no separate export needed

export default function CustomOrderPage({ params }) {
  const { slug } = params;
  const [kitchen,   setKitchen]   = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart,      setCart]      = useState({}); // { itemId: { ...item, qty, itemNote } }
  const [customItems, setCustomItems] = useState([]); // free-text items not on menu
  const [customDraft,  setCustomDraft]  = useState({ name: '', price: '', note: '' });
  const [form,      setForm]      = useState({ name: '', phone: '', address: '', event_date: '', people: '', event_type: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [noteEdit,  setNoteEdit]  = useState(null); // itemId currently editing note
  const [activeCat, setActiveCat] = useState('All');

  useEffect(() => {
    async function load() {
      const { data: k } = await getSupabase().from('kitchens').select('*').eq('slug', slug).single();
      if (!k) return;
      setKitchen(k);
      const { data: m } = await getSupabase().from('menu_items').select('*')
        .eq('kitchen_id', k.id).eq('active', true).order('category');
      setMenuItems(m || []);
    }
    load();
  }, [slug]);

  const categories = ['All', ...new Set(menuItems.map((i) => i.category || i.cat))];
  const filtered   = activeCat === 'All' ? menuItems : menuItems.filter((i) => (i.category || i.cat) === activeCat);

  function addItem(item) {
    setCart((p) => ({ ...p, [item.id]: { ...item, qty: (p[item.id]?.qty || 0) + 1, itemNote: p[item.id]?.itemNote || '' } }));
  }
  function removeItem(id) {
    setCart((p) => {
      const c = { ...p };
      if (c[id]?.qty > 1) c[id] = { ...c[id], qty: c[id].qty - 1 };
      else delete c[id];
      return c;
    });
  }
  function setNote(id, note) {
    setCart((p) => ({ ...p, [id]: { ...p[id], itemNote: note } }));
  }

  const cartList    = Object.values(cart);
  const allItems    = [...cartList, ...customItems.filter(i => i.name)];
  const hasItems    = allItems.length > 0;

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.phone) { alert('Name and phone are required'); return; }
    if (!hasItems) { alert('Please add at least one item'); return; }
    setLoading(true);

    const items = [
      ...cartList.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️', note: i.itemNote || '' })),
      ...customItems.filter(i => i.name).map((i) => ({ name: i.name, qty: 1, price: Number(i.price) || 0, emoji: '✏️', note: i.note || '' })),
    ];
    const total = items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

    await getSupabase().from('custom_requests').insert({
      kitchen_id:   kitchen.id,
      name:         form.name,
      phone:        form.phone,
      address:      form.address || null,
      event_type:   form.event_type || null,
      event_date:   form.event_date || null,
      people:       form.people ? Number(form.people) : null,
      requirements: form.requirements || null,
      items,
      total,
    });

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) return (
    <div className="page" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontWeight: 800, fontSize: '1.6rem', marginBottom: 10 }}>Request Submitted!</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 8 }}>The kitchen will review your items and contact you to confirm.</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 28 }}>You can check the status by entering your phone number in <b>My Orders</b>.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href={`/${slug}/orders`} className="btn-primary" style={{ maxWidth: 200 }}>📋 Track Request</Link>
        <Link href={`/${slug}`} className="btn-outline" style={{ maxWidth: 200 }}>← Back to Menu</Link>
      </div>
    </div>
  );

  return (
    <div className="page">
      <Link href={`/${slug}`} style={{ color: 'var(--muted)', fontSize: '0.88rem', display: 'inline-block', marginBottom: 16 }}>← Back to Menu</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>📝 Custom Order</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20 }}>Pick items and add special notes for each. Items not on the menu? Add them below.</p>

      {/* CATEGORY TABS */}
      <div className="cat-tabs">
        {categories.map((c) => (
          <button key={c} className={`cat-tab ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>{c}</button>
        ))}
      </div>

      {/* MENU ITEMS */}
      <div className="menu-grid" style={{ marginBottom: 24 }}>
        {filtered.map((item) => {
          const inCart = cart[item.id];
          return (
            <div key={item.id} className="menu-card">
              <div className="menu-emoji">
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji || '🍽️'}
              </div>
              <div className="menu-info">
                <div className="menu-meta"><h3>{item.name}</h3></div>
                {item.description && <p className="menu-desc">{item.description}</p>}
                <div className="menu-footer">
                  <div className="menu-price">₹{item.price}</div>
                  {inCart ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => removeItem(item.id)}>−</button>
                        <span className="qty-num">{inCart.qty}</span>
                        <button className="qty-btn" onClick={() => addItem(item)}>+</button>
                      </div>
                      {/* Per-item note */}
                      {noteEdit === item.id ? (
                        <div style={{ width: '100%' }}>
                          <input
                            autoFocus
                            value={inCart.itemNote || ''}
                            onChange={(e) => setNote(item.id, e.target.value)}
                            onBlur={() => setNoteEdit(null)}
                            placeholder="e.g. only sambar, no chutney"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--primary)', fontSize: '0.82rem' }}
                          />
                        </div>
                      ) : (
                        <button onClick={() => setNoteEdit(item.id)} style={{ fontSize: '0.72rem', color: inCart.itemNote ? 'var(--primary)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {inCart.itemNote ? `📝 ${inCart.itemNote}` : '+ Add note for this item'}
                        </button>
                      )}
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

      {/* CUSTOM ITEMS (not on menu) */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 20px', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>➕ Add Items Not on Menu</div>
        {customItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 120, fontWeight: 600, fontSize: '0.88rem' }}>✏️ {item.name}</div>
            {/* No price shown to customer */}
            {item.note && <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontStyle: 'italic' }}>"{item.note}"</div>}
            <button onClick={() => setCustomItems(p => p.filter((_, j) => j !== i))} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem', color: '#991b1b' }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
          <input value={customDraft.name} onChange={(e) => setCustomDraft(p => ({...p, name: e.target.value}))} placeholder="Item name" style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.9rem' }} />
          {/* Price removed — admin sets price when accepting */}
          <input value={customDraft.note} onChange={(e) => setCustomDraft(p => ({...p, note: e.target.value}))} placeholder="Special requirement (optional)" style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.9rem' }} />
          <button onClick={() => { if (!customDraft.name) return; setCustomItems(p => [...p, {...customDraft, price: 0}]); setCustomDraft({ name: '', price: '', note: '' }); }}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px', fontWeight: 700, cursor: 'pointer' }}>
            Add
          </button>
        </div>
      </div>

      {/* ORDER SUMMARY */}
      {hasItems && (
        <div style={{ background: '#fff8f5', border: '1.5px solid #ffcbb0', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🛒 Your Custom Order</div>
          {cartList.map((i) => (
            <div key={i.id} style={{ fontSize: '0.88rem', marginBottom: 6 }}>
              {i.emoji} <b>{i.name}</b> ×{i.qty}
              {i.itemNote && <span style={{ color: 'var(--primary)', marginLeft: 8, fontStyle: 'italic' }}>"{i.itemNote}"</span>}
            </div>
          ))}
          {customItems.filter(i => i.name).map((i, idx) => (
            <div key={idx} style={{ fontSize: '0.88rem', marginBottom: 6 }}>
              ✏️ <b>{i.name}</b> {i.note && <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>"{i.note}"</span>}
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER DETAILS */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 20px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Your Details</div>
        <form onSubmit={submit}>
          <div className="form-group"><label>NAME *</label><input name="name" value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} placeholder="Ravi Kumar" required /></div>
          <div className="form-group"><label>PHONE (WhatsApp) *</label><input name="phone" type="tel" value={form.phone} onChange={(e) => setForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="form-group"><label>EVENT DATE</label><input name="event_date" type="date" value={form.event_date} onChange={(e) => setForm(p => ({...p, event_date: e.target.value}))} min={new Date().toISOString().split('T')[0]} /></div>
            <div className="form-group"><label>NO. OF PEOPLE</label><input name="people" type="number" min="1" value={form.people} onChange={(e) => setForm(p => ({...p, people: e.target.value}))} placeholder="50" /></div>
          </div>
          <div className="form-group"><label>DELIVERY ADDRESS</label><textarea name="address" rows={2} value={form.address} onChange={(e) => setForm(p => ({...p, address: e.target.value}))} placeholder="Plot 12, HITEC City…" /></div>
          <button type="submit" className="btn-primary" disabled={loading || !hasItems} style={{ marginTop: 4 }}>
            {loading ? 'Submitting…' : '📩 Submit Custom Order'}
          </button>
          {!hasItems && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8 }}>Add at least one item to submit.</p>}
        </form>
      </div>
    </div>
  );
}
