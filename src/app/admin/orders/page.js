'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const STATUS_LABELS = { new: '🟡 New', progress: '🔵 In Progress', delivered: '✅ Delivered' };
const STATUS_BADGE  = { new: 'badge-new', progress: 'badge-progress', delivered: 'badge-delivered' };
const PAY_STATUS    = {
  pending:   { label: '💳 Pending',    bg: '#fef9c3', color: '#854d0e' },
  partial:   { label: '💰 Partial',    bg: '#fff7ed', color: '#c2410c' },
  confirmed: { label: '✅ Paid',       bg: '#dcfce7', color: '#166534' },
};

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

    // Load custom order requests
    supabase.from('custom_requests').select('*').eq('kitchen_id', profile.kitchen_id)
      .eq('status', 'new').order('created_at', { ascending: false })
      .then(({ data }) => setCustomReqs(data || []));

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

  function openEditOrder(order) {
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    // Build editCart from existing items
    const cart = {};
    items.forEach((item, i) => {
      cart[`existing_${i}`] = { name: item.name, price: item.price, emoji: item.emoji || '🍽️', qty: item.qty };
    });
    setEditCart(cart);
    setEditingOrder(order);
  }

  async function saveEditedOrder() {
    const items = Object.values(editCart).filter((i) => i.qty > 0);
    if (!items.length) { alert('Add at least one item'); return; }
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    await getSupabase().from('orders').update({
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji || '🍽️' })),
      total,
      delivery_date: editingOrder._editDate || editingOrder.delivery_date || null,
      delivery_time: editingOrder._editTime || editingOrder.delivery_time || null,
      note:          editingOrder._editNote !== undefined ? editingOrder._editNote : editingOrder.note,
    }).eq('id', editingOrder.id);
    setEditingOrder(null);
    setEditCart({});
  }

  async function confirmPayment(order) {    const received = prompt(
      `Enter amount received for #${order.id}\nTotal: ₹${order.total}${order.amount_received > 0 ? `\nPreviously received: ₹${order.amount_received}` : ''}`,
      String(order.total)
    );
    if (received === null) return;
    const amt    = Math.max(0, Number(received) || 0);
    const status = amt >= order.total ? 'confirmed' : amt > 0 ? 'partial' : 'pending';
    await getSupabase().from('orders').update({ payment_status: status, amount_received: amt }).eq('id', order.id);
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
    setSavedOrderId({ id, phone, name });
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

  const [search, setSearch]     = useState('');
  const [customReqs, setCustomReqs] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editCart,     setEditCart]     = useState({});

  // Separate active vs cancelled orders
  const activeOrders    = orders.filter((o) => !o.is_deleted);
  const cancelledOrders = orders.filter((o) => o.is_deleted);

  // Filter by tab first, then by search query
  const tabFiltered =
    filter === 'cancelled' ? cancelledOrders :
    filter === 'unpaid'    ? activeOrders.filter((o) => o.payment_status !== 'confirmed') :
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

  const newCount      = activeOrders.filter((o) => o.status === 'new').length;
  const progCount     = activeOrders.filter((o) => o.status === 'progress').length;
  const doneCount     = activeOrders.filter((o) => o.status === 'delivered').length;
  const revenue       = activeOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const unpaidOrders  = activeOrders.filter((o) => o.payment_status !== 'confirmed');
  const pendingAmount = unpaidOrders.reduce((s, o) => s + (o.total - (o.amount_received || 0)), 0);

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
        <button className="action-btn accept" style={{ fontWeight: 700 }} onClick={() => setShowManual(true)}>
          📞 Log Phone Order
        </button>
      </div>

      {/* EDIT ORDER OVERLAY */}
      {editingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingOrder(null); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: '0 0 24px' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>✏️ Edit Order #{editingOrder.id}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                  {editingOrder.customer_name} · {editingOrder.customer_phone}
                </div>
              </div>
              <button onClick={() => setEditingOrder(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px 0' }}>
              {/* Menu items — tap to add, shows current qty */}
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>ITEMS (tap to add more)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {menuItems.map((item) => {
                  const inCart = Object.values(editCart).find(c => c.name === item.name);
                  const qty    = inCart?.qty || 0;
                  const cartKey = Object.entries(editCart).find(([,c]) => c.name === item.name)?.[0] || `m_${item.id}`;
                  return (
                    <button key={item.id} onClick={() => setEditCart(p => ({ ...p, [cartKey]: { name: item.name, price: item.price, emoji: item.emoji, qty: (p[cartKey]?.qty || 0) + 1 } }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 30,
                        border: qty > 0 ? '2px solid var(--primary)' : '1.5px solid #e0e0e0',
                        background: qty > 0 ? '#fff8f5' : '#fff', cursor: 'pointer',
                        fontWeight: qty > 0 ? 700 : 500, fontSize: '0.88rem',
                        color: qty > 0 ? 'var(--primary)' : 'var(--text)' }}>
                      <span>{item.emoji || '🍽️'}</span><span>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>₹{item.price}</span>
                      {qty > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 800 }}>{qty}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Current cart with qty controls */}
              {Object.values(editCart).filter(i => i.qty > 0).length > 0 && (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                  {Object.entries(editCart).filter(([,i]) => i.qty > 0).map(([id, item]) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.88rem' }}>
                      <span>{item.emoji} {item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setEditCart(p => { const c = {...p}; if (c[id]?.qty > 1) c[id] = {...c[id], qty: c[id].qty-1}; else delete c[id]; return c; })}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                        <button className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setEditCart(p => ({...p, [id]: {...p[id], qty: p[id].qty+1}}))}>+</button>
                      </div>
                    </div>
                  ))}
                  {/* Add unlisted item */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input value={customItem.name} onChange={(e) => setCustomItem(p => ({...p, name: e.target.value}))} placeholder="Other item…" style={{ flex: 2, padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '0.88rem' }} />
                    <input type="number" value={customItem.price} onChange={(e) => setCustomItem(p => ({...p, price: e.target.value}))} placeholder="₹" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '0.88rem' }} />
                    <button onClick={() => { if (!customItem.name || !customItem.price) return; setEditCart(p => ({...p, ['c_'+Date.now()]: {name: customItem.name, price: Number(customItem.price), emoji: '✏️', qty: 1}})); setCustomItem({name:'',price:'',qty:1}); }}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
                  </div>
                </div>
              )}

              {/* Date / time / note */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>DATE</div>
                  <input type="date" defaultValue={editingOrder.delivery_date || ''} onChange={(e) => setEditingOrder(p => ({...p, _editDate: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>TIME</div>
                  <select defaultValue={editingOrder.delivery_time || ''} onChange={(e) => setEditingOrder(p => ({...p, _editTime: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff' }}>
                    <option value="">Any time</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>NOTE</div>
                <input defaultValue={editingOrder.note || ''} onChange={(e) => setEditingOrder(p => ({...p, _editNote: e.target.value}))}
                  placeholder="Special instructions…" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem' }} />
              </div>
            </div>

            {/* Sticky footer */}
            <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                {Object.values(editCart).filter(i=>i.qty>0).length > 0
                  ? <><div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{Object.values(editCart).reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{Object.values(editCart).filter(i=>i.qty>0).length} item(s)</div></>
                  : <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Remove all → order deleted</div>
                }
              </div>
              <button onClick={saveEditedOrder}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 28px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PHONE ORDER OVERLAY */}
      {showManual && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowManual(false); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: '0 0 24px' }}>

            {/* Header */}
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>📞 Quick Phone Order</div>
              <button onClick={() => setShowManual(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px 0' }}>
              {/* Required: name + phone + address */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>NAME *</div>
                  <input autoFocus value={manualForm.name} onChange={(e) => setManualForm(p => ({...p, name: e.target.value}))}
                    placeholder="Ravi Kumar" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>PHONE *</div>
                  <input type="tel" value={manualForm.phone} onChange={(e) => setManualForm(p => ({...p, phone: e.target.value}))}
                    placeholder="+91 9876543210" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>DELIVERY ADDRESS *</div>
                <input value={manualForm.address} onChange={(e) => setManualForm(p => ({...p, address: e.target.value}))}
                  placeholder="Plot 12, HITEC City, Hyderabad…" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }} />
              </div>

              {/* Step 2: Items as quick-tap chips */}
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>TAP TO ADD ITEMS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {menuItems.map((item) => {
                  const qty = manualCart[item.id]?.qty || 0;
                  return (
                    <button key={item.id} onClick={() => setManualCart(p => ({ ...p, [item.id]: { name: item.name, price: item.price, emoji: item.emoji, qty: (p[item.id]?.qty || 0) + 1 } }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                        borderRadius: 30, border: qty > 0 ? '2px solid var(--primary)' : '1.5px solid #e0e0e0',
                        background: qty > 0 ? '#fff8f5' : '#fff', cursor: 'pointer',
                        fontWeight: qty > 0 ? 700 : 500, fontSize: '0.88rem',
                        color: qty > 0 ? 'var(--primary)' : 'var(--text)',
                        transition: 'all 0.15s',
                      }}>
                      <span>{item.emoji || '🍽️'}</span>
                      <span>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>₹{item.price}</span>
                      {qty > 0 && (
                        <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 800 }}>{qty}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Qty controls for added items */}
              {Object.values(manualCart).filter(i => i.qty > 0).length > 0 && (
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                  {Object.entries(manualCart).filter(([,i]) => i.qty > 0).map(([id, item]) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.88rem' }}>
                      <span>{item.emoji} {item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setManualCart(p => { const c = {...p}; if (c[id]?.qty > 1) c[id] = {...c[id], qty: c[id].qty-1}; else delete c[id]; return c; })}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                        <button className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setManualCart(p => ({...p, [id]: {...p[id], qty: p[id].qty+1}}))}>+</button>
                      </div>
                    </div>
                  ))}
                  {/* custom item quick add */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input value={customItem.name} onChange={(e) => setCustomItem(p => ({...p, name: e.target.value}))} placeholder="Other item…" style={{ flex: 2, padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '0.88rem' }} />
                    <input type="number" value={customItem.price} onChange={(e) => setCustomItem(p => ({...p, price: e.target.value}))} placeholder="₹" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: '0.88rem' }} />
                    <button onClick={() => { if (!customItem.name || !customItem.price) return; setManualCart(p => ({...p, ['c_'+Date.now()]: {name: customItem.name, price: Number(customItem.price), emoji: '✏️', qty: 1}})); setCustomItem({name:'',price:'',qty:1}); }}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+</button>
                  </div>
                </div>
              )}

              {/* Step 3: Optional extras (collapsible feel) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>DATE (optional)</div>
                  <input type="date" value={manualForm.delivery_date} min={today} onChange={(e) => setManualForm(p => ({...p, delivery_date: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>TIME (optional)</div>
                  <select value={manualForm.delivery_time} onChange={(e) => setManualForm(p => ({...p, delivery_time: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff' }}>
                    <option value="">Any time</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>NOTE</div>
                  <input value={manualForm.note} onChange={(e) => setManualForm(p => ({...p, note: e.target.value}))}
                    placeholder="Special instructions…" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: 0.5 }}>PAYMENT</div>
                  <select value={manualForm.payment_method} onChange={(e) => setManualForm(p => ({...p, payment_method: e.target.value}))}
                    style={{ padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff' }}>
                    <option value="cod">COD</option>
                    <option value="gpay">GPay</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sticky footer with total + save */}
            <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                {Object.values(manualCart).filter(i=>i.qty>0).length > 0
                  ? <><div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{Object.values(manualCart).reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{Object.values(manualCart).filter(i=>i.qty>0).length} item{Object.values(manualCart).filter(i=>i.qty>0).length>1?'s':''}</div></>
                  : <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No items added yet</div>
                }
              </div>
              <button onClick={saveManualOrder} disabled={saving || !Object.values(manualCart).filter(i=>i.qty>0).length}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 28px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', opacity: (saving || !Object.values(manualCart).filter(i=>i.qty>0).length) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : '✅ Save Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI STATS */}
      <div className="admin-stats">
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>{newCount}</div><div className="stat-lbl">New</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{progCount}</div><div className="stat-lbl">In Progress</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{doneCount}</div><div className="stat-lbl">Delivered</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#8b5cf6' }}>₹{revenue.toLocaleString('en-IN')}</div><div className="stat-lbl">Revenue</div></div>
      </div>

      {/* CUSTOM ORDER REQUESTS */}
      {customReqs.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>
            📝 {customReqs.length} Custom Order Request{customReqs.length > 1 ? 's' : ''}
          </div>
          {customReqs.map((r) => {
            const items = Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]');
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.name} — {r.event_type || 'Custom Request'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      📞 {r.phone} {r.event_date && `· 📅 ${new Date(r.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} {r.people && `· 👥 ${r.people} people`}
                    </div>
                    {r.address && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {r.address}</div>}
                  </div>
                  {r.total > 0 && <div style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{r.total}</div>}
                </div>

                {/* Item boxes — same style as regular orders */}
                {items.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ background: '#f8faff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', minWidth: 130 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.emoji || '🍽️'} {item.name}</div>
                        {item.qty > 1 && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Qty: {item.qty}</div>}
                        {item.note && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: 2 }}>"{item.note}"</div>}
                        {item.price > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>₹{item.price * (item.qty || 1)}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {r.requirements && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 10, fontStyle: 'italic' }}>💬 "{r.requirements}"</div>}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Accept → converts to a real trackable order */}
                  <button
                    onClick={async () => {
                      if (!r.address && !window.confirm('No address provided. Accept anyway?')) return;
                      const id = 'SF-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
                      await getSupabase().from('orders').insert({
                        id,
                        kitchen_id:     profile.kitchen_id,
                        customer_name:  r.name,
                        customer_phone: r.phone,
                        address:        r.address || 'To be confirmed',
                        note:           r.requirements || '',
                        items:          items.length > 0 ? items : [{ name: 'Custom Order', qty: 1, price: r.total || 0, emoji: '📝' }],
                        total:          r.total || 0,
                        payment_method: 'cod',
                        status:         'new',
                      });
                      await getSupabase().from('custom_requests').update({ status: 'confirmed' }).eq('id', r.id);
                      setCustomReqs(p => p.filter(x => x.id !== r.id));
                    }}
                    style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    ✅ Accept & Create Order
                  </button>
                  <a href={`https://wa.me/${r.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${r.name}! We received your custom order request. Let's confirm the details.`)}`}
                    target="_blank" rel="noreferrer"
                    style={{ background: '#25d366', color: '#fff', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
                    📱 WhatsApp
                  </a>
                  <button onClick={async () => {
                    await getSupabase().from('custom_requests').update({ status: 'rejected' }).eq('id', r.id);
                    setCustomReqs(p => p.filter(x => x.id !== r.id));
                  }} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                    ✕ Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PENDING PAYMENT ALERT */}
      {pendingAmount > 0 && (
        <div style={{ background: '#fef9c3', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#854d0e' }}>💳 ₹{pendingAmount.toLocaleString('en-IN')} payment not yet confirmed</div>
            <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: 2 }}>{unpaidOrders.length} order{unpaidOrders.length > 1 ? 's' : ''} with unconfirmed or partial payment</div>
          </div>
          <button onClick={() => setFilter('unpaid')} style={{ background: '#854d0e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View Unpaid →
          </button>
        </div>
      )}

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
        <button
          className={`cat-tab ${filter === 'unpaid' ? 'active' : ''}`}
          onClick={() => setFilter('unpaid')}
          style={filter !== 'unpaid' && unpaidOrders.length > 0 ? { borderColor: '#854d0e', color: '#854d0e' } : {}}
        >
          💳 Unpaid {unpaidOrders.length > 0 && `(${unpaidOrders.length})`}
        </button>
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
          <div className="ico">{filter === 'cancelled' ? '🗑️' : filter === 'unpaid' ? '✅' : '📋'}</div>
          <p>{filter === 'cancelled' ? 'No cancelled orders' : filter === 'unpaid' ? 'All payments confirmed!' : `No orders${filter !== 'all' ? ` with status "${filter}"` : ' yet'}`}</p>
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
            <div className="order-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span>₹{order.total}</span>
              {/* Payment status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const ps = PAY_STATUS[order.payment_status || 'pending'];
                  return (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ps.bg, color: ps.color, whiteSpace: 'nowrap' }}>
                      {ps.label}
                      {order.amount_received > 0 && order.payment_status !== 'confirmed' && ` ₹${order.amount_received}`}
                    </span>
                  );
                })()}
                {order.payment_status !== 'confirmed' && (
                  <button
                    className="action-btn"
                    style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '5px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => confirmPayment(order)}
                  >
                    ✅ Confirm Payment
                  </button>
                )}
                {order.advance_paid && order.advance_amount > 0 && (
                  <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 20, padding: '3px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Advance ₹{order.advance_amount}
                  </span>
                )}
              </div>
            </div>

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
                {/* Edit — only before delivered */}
                {order.status !== 'delivered' && (
                  <button className="action-btn" style={{ background: '#eff6ff', color: '#1e40af' }} onClick={() => openEditOrder(order)}>✏️ Edit</button>
                )}
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
