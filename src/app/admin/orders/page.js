'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const STATUS_LABELS = { new: '🟡 New', progress: '🔵 In Progress', delivered: '✅ Delivered' };
const STATUS_BADGE  = { new: 'badge-new', progress: 'badge-progress', delivered: 'badge-delivered' };

export default function AdminOrdersPage() {
  const { profile } = useAuth();
  const [orders,    setOrders]    = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [undoing,   setUndoing]   = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [menuItems,  setMenuItems]  = useState([]);
  const [manualForm, setManualForm] = useState({ name: '', phone: '', address: '', note: '', delivery_date: '', delivery_time: '', payment_method: 'cod' });
  const [manualCart, setManualCart] = useState({}); // itemId -> {name, price, qty}
  const [saving,     setSaving]     = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [customItem, setCustomItem] = useState({ name: '', price: '', qty: 1 });

  const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
    const h = i + 10;
    return h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
  });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profile?.kitchen_id) return;
    const supabase = getSupabase();

    async function loadOrders() {
      const { data } = await supabase
        .from('orders').select('*')
        .eq('kitchen_id', profile.kitchen_id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    }
    loadOrders();

    // Load menu items for manual order form
    supabase.from('menu_items').select('id,name,price,category,emoji').eq('kitchen_id', profile.kitchen_id).eq('active', true)
      .then(({ data }) => setMenuItems(data || []));

    // Real-time: new orders, status changes, cancellations
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `kitchen_id=eq.${profile.kitchen_id}`
      }, loadOrders)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile]);

  async function updateStatus(id, status) {
    await getSupabase().from('orders').update({ status }).eq('id', id);
    if (status === 'delivered') {
      const order = orders.find((o) => o.id === id);
      if (order) sendFeedbackWhatsApp(order);
    }
  }

  // Soft delete by admin (is_deleted = true, deleted_by = 'admin')
  async function softDelete(id) {
    if (!confirm('Hide this order? You can undo this anytime from the Cancelled tab.')) return;
    await getSupabase().from('orders').update({
      is_deleted: true,
      deleted_by: 'admin',
      deleted_at: new Date().toISOString(),
    }).eq('id', id);
  }

  // Undo delete — restores order to its original state
  async function undoDelete(id) {
    setUndoing(id);
    await getSupabase().from('orders').update({
      is_deleted:  false,
      deleted_by:  null,
      deleted_at:  null,
    }).eq('id', id);
    setUndoing(null);
  }

  async function saveManualOrder() {
    const { name, phone, address, payment_method } = manualForm;
    if (!name || !phone || !address) { alert('Name, phone and address are required'); return; }
    const items = Object.values(manualCart).filter((i) => i.qty > 0);
    if (!items.length) { alert('Add at least one item'); return; }
    setSaving(true);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const id = 'SF-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    await getSupabase().from('orders').insert({
      id, kitchen_id: profile.kitchen_id,
      customer_name: name, customer_phone: phone, address,
      note: manualForm.note,
      delivery_date: manualForm.delivery_date || null,
      delivery_time: manualForm.delivery_time || null,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️' })),
      total, payment_method, status: 'new',
    });
    setManualForm({ name: '', phone: '', address: '', note: '', delivery_date: '', delivery_time: '', payment_method: 'cod' });
    setManualCart({});
    setShowManual(false);
    setSaving(false);
  }

  function sendFeedbackWhatsApp(order) {
    const kitchen     = profile?.kitchens;
    const feedbackUrl = `${window.location.origin}/${kitchen?.slug}/feedback/${order.id}`;
    const msg = encodeURIComponent(
      `Hi ${order.customer_name}! 🎉 Your ${kitchen?.name} order #${order.id} has been delivered!\n\nShare feedback:\n${feedbackUrl}\n\nThank you! 🙏`
    );
    window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  }

  function openWhatsApp(order) {
    const statusMsg = order.status === 'progress' ? 'is being prepared 👨‍🍳' : 'has been received ✅';
    const msg = encodeURIComponent(`Hi ${order.customer_name}! Your order #${order.id} ${statusMsg}`);
    window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  }

  const [search, setSearch] = useState('');

  // Separate active vs cancelled orders
  const activeOrders    = orders.filter((o) => !o.is_deleted);
  const cancelledOrders = orders.filter((o) => o.is_deleted);

  // Filter by tab first, then by search query
  const tabFiltered =
    filter === 'cancelled' ? cancelledOrders :
    filter === 'all'       ? activeOrders :
    activeOrders.filter((o) => o.status === filter);

  const filtered = search.trim()
    ? tabFiltered.filter((o) => {
        const q = search.trim().toLowerCase();
        // Match: order id (partial), customer name, phone, address, items
        const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
        return (
          o.id.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          items.some((i) => i.name?.toLowerCase().includes(q))
        );
      })
    : tabFiltered;

  const newCount   = activeOrders.filter((o) => o.status === 'new').length;
  const progCount  = activeOrders.filter((o) => o.status === 'progress').length;
  const doneCount  = activeOrders.filter((o) => o.status === 'delivered').length;
  const revenue    = activeOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <h2>📋 Orders</h2>
        <p>Real-time incoming orders — update status &amp; notify customers</p>
      </div>

      {/* WhatsApp share prompt after manual order saved */}
      {savedOrderId && (() => {
        const trackUrl = `${window.location.origin}/${profile?.kitchens?.slug}/order/${savedOrderId.id}`;
        const msg = encodeURIComponent(`Hi ${savedOrderId.name}! 🍳 Your order has been confirmed with ${profile?.kitchens?.name}.\n\nTrack your order here:\n${trackUrl}\n\nThank you! 🙏`);
        const waUrl = `https://wa.me/${savedOrderId.phone.replace(/\D/g,'')}?text=${msg}`;
        return (
          <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>✅ Order #{savedOrderId.id} saved!</div>
              <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>Share the tracking link with {savedOrderId.name} on WhatsApp.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={waUrl} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: '#fff', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                📱 Send WhatsApp
              </a>
              <button onClick={() => setSavedOrderId(null)} style={{ background: 'transparent', border: '1.5px solid #86efac', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#166534' }}>✕</button>
            </div>
          </div>
        );
      })()}
      <div style={{ marginBottom: 20 }}>
        <button className="action-btn accept" style={{ fontWeight: 700 }} onClick={() => setShowManual(!showManual)}>
          {showManual ? '✕ Cancel' : '📞 Log Phone Order'}
        </button>
      </div>

      {showManual && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 24, border: '2px solid var(--primary)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📞 Manual Order Entry</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16 }}>Log an order placed via phone call.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group"><label>CUSTOMER NAME *</label><input value={manualForm.name} onChange={(e) => setManualForm(p => ({...p, name: e.target.value}))} placeholder="Ravi Kumar" /></div>
            <div className="form-group"><label>PHONE *</label><input value={manualForm.phone} onChange={(e) => setManualForm(p => ({...p, phone: e.target.value}))} placeholder="+91 9876543210" type="tel" /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>DELIVERY ADDRESS *</label><textarea value={manualForm.address} onChange={(e) => setManualForm(p => ({...p, address: e.target.value}))} rows={2} placeholder="Plot 12, HITEC City…" /></div>
            <div className="form-group"><label>DELIVERY DATE</label><input type="date" value={manualForm.delivery_date} min={today} onChange={(e) => setManualForm(p => ({...p, delivery_date: e.target.value}))} /></div>
            <div className="form-group"><label>DELIVERY TIME</label>
              <select value={manualForm.delivery_time} onChange={(e) => setManualForm(p => ({...p, delivery_time: e.target.value}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }}>
                <option value="">Any time</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>PAYMENT</label>
              <select value={manualForm.payment_method} onChange={(e) => setManualForm(p => ({...p, payment_method: e.target.value}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }}>
                <option value="cod">Cash on Delivery</option>
                <option value="gpay">GPay / UPI</option>
                <option value="paid">Already Paid</option>
              </select>
            </div>
            <div className="form-group"><label>NOTE</label><input value={manualForm.note} onChange={(e) => setManualForm(p => ({...p, note: e.target.value}))} placeholder="Extra spicy, no onion…" /></div>
          </div>

          <div style={{ fontWeight: 700, marginBottom: 10 }}>Select Menu Items</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
            {menuItems.map((item) => {
              const qty = manualCart[item.id]?.qty || 0;
              return (
                <div key={item.id} style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.emoji || '🍽️'} {item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>₹{item.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="qty-btn" onClick={() => setManualCart(p => { const c = {...p}; if (c[item.id]?.qty > 1) c[item.id].qty--; else delete c[item.id]; return c; })}>−</button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                    <button className="qty-btn" onClick={() => setManualCart(p => ({ ...p, [item.id]: { name: item.name, price: item.price, emoji: item.emoji, qty: (p[item.id]?.qty || 0) + 1 } }))}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom item — for orders not on the menu */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.85rem' }}>➕ Add Custom Item (not on menu)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 140 }}>
                <label>ITEM NAME</label>
                <input value={customItem.name} onChange={(e) => setCustomItem(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Special Biryani" />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 80 }}>
                <label>PRICE ₹</label>
                <input type="number" value={customItem.price} onChange={(e) => setCustomItem(p => ({ ...p, price: e.target.value }))} placeholder="500" />
              </div>
              <div className="form-group" style={{ margin: 0, width: 70 }}>
                <label>QTY</label>
                <input type="number" min="1" value={customItem.qty} onChange={(e) => setCustomItem(p => ({ ...p, qty: Number(e.target.value) }))} />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!customItem.name || !customItem.price) return;
                  const key = 'custom_' + Date.now();
                  setManualCart(p => ({ ...p, [key]: { name: customItem.name, price: Number(customItem.price), emoji: '🍽️', qty: customItem.qty } }));
                  setCustomItem({ name: '', price: '', qty: 1 });
                }}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: 2 }}
              >
                Add
              </button>
            </div>
          </div>

          {Object.values(manualCart).filter(i => i.qty > 0).length > 0 && (
            <div style={{ background: '#fff8f5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.88rem' }}>
              <b>Total: ₹{Object.values(manualCart).reduce((s,i) => s + i.price * i.qty, 0)}</b>
              &nbsp;·&nbsp; {Object.values(manualCart).filter(i=>i.qty>0).map(i=>`${i.name} ×${i.qty}`).join(', ')}
            </div>
          )}

          <button className="btn-primary" onClick={saveManualOrder} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Saving…' : '✅ Save Order'}
          </button>
        </div>
      )}

      {/* KPI STATS */}
      <div className="admin-stats">
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>{newCount}</div><div className="stat-lbl">New</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{progCount}</div><div className="stat-lbl">In Progress</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{doneCount}</div><div className="stat-lbl">Delivered</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#8b5cf6' }}>₹{revenue.toLocaleString('en-IN')}</div><div className="stat-lbl">Revenue</div></div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by order ID, name, phone, item…"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        />
        {search && (
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            <button onClick={() => setSearch('')} style={{ marginLeft: 8, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
          </div>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="cat-tabs" style={{ marginBottom: 20 }}>
        {['all','new','progress','delivered'].map((f) => (
          <button key={f} className={`cat-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Orders' : STATUS_LABELS[f]}
          </button>
        ))}
        {/* Cancelled tab — shows soft-deleted orders with undo option */}
        <button
          className={`cat-tab ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
          style={filter !== 'cancelled' && cancelledOrders.length > 0 ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
        >
          ❌ Cancelled {cancelledOrders.length > 0 && `(${cancelledOrders.length})`}
        </button>
      </div>

      {!filtered.length && (
        <div className="empty-state">
          <div className="ico">{filter === 'cancelled' ? '🗑️' : '📋'}</div>
          <p>{filter === 'cancelled' ? 'No cancelled orders' : `No orders${filter !== 'all' ? ` with status "${filter}"` : ' yet'}`}</p>
        </div>
      )}

      {filtered.map((order) => {
        const items      = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
        const isCancelled = order.is_deleted;

        return (
          <div key={order.id} className="order-card" style={isCancelled ? { opacity: 0.75, borderLeft: '3px solid var(--red)' } : {}}>
            <div className="order-top">
              <div>
                <h4>#{order.id} — {order.customer_name}</h4>
                <small>
                  📞 {order.customer_phone} &nbsp;|&nbsp;
                  💳 {order.payment_method?.toUpperCase()} &nbsp;|&nbsp;
                  🕐 {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </small>
                {(order.delivery_date || order.delivery_time) && (
                  <div style={{ marginTop: 4, fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', display: 'inline-block', borderRadius: 6, padding: '2px 8px' }}>
                    📅 {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
                  </div>
                )}
              </div>
              {isCancelled ? (
                <span className="badge" style={{ background: '#fef2f2', color: 'var(--red)' }}>
                  ❌ Cancelled by {order.deleted_by}
                </span>
              ) : (
                <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABELS[order.status]}</span>
              )}
            </div>

            <div className="order-items">{items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}{order.note ? ` | 📝 ${order.note}` : ''}</div>
            <div className="order-items" style={{ fontSize: '0.82rem' }}>📍 {order.address}</div>
            <div className="order-total">₹{order.total}</div>

            {/* CANCELLED ORDER — show undo button */}
            {isCancelled && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  🗑️ Deleted {order.deleted_at ? new Date(order.deleted_at).toLocaleString('en-IN') : ''}
                </div>
                {/* UNDO DELETE TOGGLE */}
                <button
                  className="action-btn"
                  style={{ background: '#fef9c3', color: '#854d0e', fontWeight: 700 }}
                  onClick={() => undoDelete(order.id)}
                  disabled={undoing === order.id}
                >
                  {undoing === order.id ? '⏳ Restoring…' : '↩️ Undo Delete'}
                </button>
              </div>
            )}

            {/* ACTIVE ORDER — normal action buttons */}
            {!isCancelled && (
              <div className="order-actions">
                {order.status === 'new'      && <button className="action-btn accept"  onClick={() => updateStatus(order.id, 'progress')}>▶ Mark In Progress</button>}
                {order.status === 'progress' && <button className="action-btn deliver" onClick={() => updateStatus(order.id, 'delivered')}>✅ Mark Delivered</button>}
                <button className="action-btn wa" onClick={() => openWhatsApp(order)}>📱 WhatsApp</button>
                <button
                  className="action-btn"
                  style={{ background: '#fef2f2', color: '#991b1b', marginLeft: 'auto' }}
                  onClick={() => softDelete(order.id)}
                >
                  🗑️ Hide
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
