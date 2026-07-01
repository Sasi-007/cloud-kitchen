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
  const [undoing,   setUndoing]   = useState(null); // order id being undone

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

  // Separate active vs cancelled orders
  const activeOrders    = orders.filter((o) => !o.is_deleted);
  const cancelledOrders = orders.filter((o) => o.is_deleted);

  const filtered =
    filter === 'cancelled' ? cancelledOrders :
    filter === 'all'       ? activeOrders :
    activeOrders.filter((o) => o.status === filter);

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

      {/* KPI STATS */}
      <div className="admin-stats">
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>{newCount}</div><div className="stat-lbl">New</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{progCount}</div><div className="stat-lbl">In Progress</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{doneCount}</div><div className="stat-lbl">Delivered</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#8b5cf6' }}>₹{revenue.toLocaleString('en-IN')}</div><div className="stat-lbl">Revenue</div></div>
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
