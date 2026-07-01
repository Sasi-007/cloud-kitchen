'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImageUpload from '@/components/ImageUpload';

const BLANK = { name: '', description: '', price: '', price_per_person: '', category: '', emoji: '🍽️', veg: true, popular: false, active: true };
const CATS  = ['Starters', 'Main Course', 'Rice & Breads', 'Desserts', 'Drinks', 'Beverages', 'Specials'];

export default function AdminMenuPage() {
  const { profile } = useAuth();
  const [items,    setItems]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [imgUrl,   setImgUrl]   = useState('');

  useEffect(() => { if (profile?.kitchen_id) loadItems(); }, [profile]);

  async function loadItems() {
    const { data } = await getSupabase()
      .from('menu_items').select('*')
      .eq('kitchen_id', profile.kitchen_id)
      .order('category').order('sort_order');
    setItems(data || []);
  }

  function openAdd() {
    setEditing(null); setForm(BLANK); setImgUrl(''); setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '', price: item.price, price_per_person: item.price_per_person || '', category: item.category, emoji: item.emoji || '🍽️', veg: item.veg, popular: item.popular, active: item.active });
    setImgUrl(item.image_url || '');
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.price || !form.category) { alert('Name, price and category are required'); return; }
    setSaving(true);
    const payload = { ...form, price: Number(form.price), price_per_person: form.price_per_person ? Number(form.price_per_person) : null, image_url: imgUrl || null, kitchen_id: profile.kitchen_id };
    if (editing) {
      await getSupabase().from('menu_items').update(payload).eq('id', editing.id);
    } else {
      await getSupabase().from('menu_items').insert(payload);
    }
    await loadItems();
    setShowForm(false); setSaving(false);
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    await getSupabase().from('menu_items').delete().eq('id', id);
    loadItems();
  }

  async function toggle(id, field, val) {
    await getSupabase().from('menu_items').update({ [field]: val }).eq('id', id);
    loadItems();
  }

  function field(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [e.target.name]: val }));
  }

  // Group by category
  const grouped = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="admin-hero" style={{ flex: 1, marginBottom: 0 }}>
          <h2>🍽️ Menu Management</h2>
          <p>Add, edit, reorder and manage your kitchen menu</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 20px', marginLeft: 16 }} onClick={openAdd}>
          + Add Item
        </button>
      </div>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24, border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20 }}>{editing ? 'Edit Item' : 'Add New Item'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>ITEM NAME *</label>
              <input name="name" value={form.name} onChange={field} placeholder="Paneer Tikka" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>DESCRIPTION</label>
              <textarea name="description" value={form.description} onChange={field} rows={2} placeholder="Short description of the dish…" />
            </div>
            <div className="form-group"><label>PRICE (₹) *</label>
              <input name="price" type="number" value={form.price} onChange={field} placeholder="180" />
            </div>
            <div className="form-group"><label>PRICE PER PERSON (₹)</label>
              <input name="price_per_person" type="number" value={form.price_per_person} onChange={field} placeholder="18" />
            </div>
            <div className="form-group"><label>CATEGORY *</label>
              <select name="category" value={form.category} onChange={field} style={{ padding: '12px 14px', border: '2px solid #eee', borderRadius: 10, fontSize: '0.95rem', width: '100%' }}>
                <option value="">Select category</option>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>EMOJI (fallback)</label>
              <input name="emoji" value={form.emoji} onChange={field} placeholder="🍽️" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" name="veg" checked={form.veg} onChange={field} /> 🟢 Vegetarian
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" name="popular" checked={form.popular} onChange={field} /> 🔥 Popular
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" name="active" checked={form.active} onChange={field} /> ✅ Active
            </label>
          </div>

          <div className="form-group">
            <label>ITEM IMAGE</label>
            <ImageUpload bucket="menu-images" currentUrl={imgUrl} onUpload={setImgUrl} label="Upload Item Photo" />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? '💾 Update Item' : '✅ Add Item'}
            </button>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* MENU LIST */}
      {!items.length && !showForm && (
        <div className="empty-state"><div className="ico">🍽️</div><p>No menu items yet. Click "Add Item" to get started.</p></div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</div>
          {catItems.map((item) => (
            <div key={item.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0, overflow: 'hidden' }}>
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{item.name} {item.veg ? '🟢' : '🔴'} {item.popular ? '🔥' : ''}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{item.description}</div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>₹{item.price}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="action-btn accept" onClick={() => openEdit(item)}>✏️ Edit</button>
                <button onClick={() => toggle(item.id, 'active', !item.active)} className="action-btn" style={{ background: item.active ? '#dcfce7' : '#fee2e2', color: item.active ? '#166534' : '#991b1b' }}>
                  {item.active ? '✅ Active' : '❌ Hidden'}
                </button>
                <button onClick={() => toggle(item.id, 'popular', !item.popular)} className="action-btn" style={{ background: '#fff3e0', color: '#e65100' }}>
                  {item.popular ? '🔥 Popular' : '➕ Popular'}
                </button>
                <button className="action-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => deleteItem(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
