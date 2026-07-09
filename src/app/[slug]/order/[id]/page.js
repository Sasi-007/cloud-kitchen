'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';

function DisputeForm({ orderId, kitchenId, customerName, customerPhone }) {
  const [type,    setType]    = useState('payment');
  const [desc,    setDesc]    = useState('');
  const [done,    setDone]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!desc.trim()) return;
    setSaving(true);
    await getSupabase().from('disputes').insert({
      order_id: orderId, kitchen_id: kitchenId,
      customer_name: customerName, customer_phone: customerPhone,
      type, description: desc,
    });
    setDone(true);
    setSaving(false);
  }

  if (done) return <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--green)', fontWeight: 600 }}>✅ Dispute raised. The kitchen team will review and contact you.</p>;

  return (
    <form onSubmit={submit} style={{ marginTop: 10, background: '#fff8f5', borderRadius: 12, padding: '14px 16px', border: '1px solid #ffcbb0' }}>
      <div style={{ marginBottom: 10 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff', marginBottom: 8 }}>
          <option value="payment">💳 Payment Issue</option>
          <option value="delivery">🚚 Delivery Issue</option>
          <option value="quality">🍽️ Food Quality Issue</option>
          <option value="other">⚠️ Other</option>
        </select>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={3}
          placeholder="Describe the issue clearly…"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.95rem', resize: 'none' }} />
      </div>
      <button type="submit" disabled={saving}
        style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
        {saving ? 'Submitting…' : '📩 Submit Dispute'}
      </button>
    </form>
  );
}

const STEPS = [
  { key: 'new',       label: 'Order Placed',    sub: 'Kitchen notified' },
  { key: 'progress',  label: 'Preparing',        sub: 'Kitchen is cooking your order' },
  { key: 'out',       label: 'Out for Delivery', sub: 'On the way to you' },
  { key: 'delivered', label: 'Delivered 🎊',     sub: 'Enjoy your meal!' },
];
const STATUS_INDEX = { new: 0, progress: 1, out: 2, delivered: 3 };

export default function OrderTrackingPage({ params }) {
  const { slug, id } = params;
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    async function loadOrder() {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) setOrder(data);
      setLoading(false);
    }
    loadOrder();

    // Real-time updates (status changes + soft-delete)
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => setOrder(payload.new))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    setCancelErr('');
    try {
      const res  = await fetch(`/api/orders/${id}/cancel`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) { setCancelErr(body.error || 'Failed to cancel'); }
      // Real-time will update order state automatically
    } catch {
      setCancelErr('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="page" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>Loading order…</div>;
  if (!order)  return <div className="page empty-state"><div className="ico">🔍</div><p>Order not found</p></div>;

  // ── CANCELLED VIEW by admin on customer request ──────────────────────────────────
  if (order.is_deleted || order.status === 'cancelled') {
    return (
      <div className="page">
        <div className="success-wrap">
          <div className="success-card">
            <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>❌</div>
            <h2 style={{ color: 'var(--red)' }}>Order Cancelled</h2>
            <div className="order-id-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: 'var(--red)' }}>
              #{order.id}
            </div>
            <p style={{ color: 'var(--muted)', margin: '12px 0', fontSize: '0.9rem' }}>
              This order has been cancelled. If you need help, contact the kitchen directly.
            </p>
            <Link href={`/${slug}`} className="btn-primary">Order Again</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── NORMAL TRACKING VIEW ────────────────────────────
  const currentIndex = STATUS_INDEX[order.status] ?? 0;

  return (
    <div className="page">
      <div className="success-wrap">
        <div className="success-card">
          <div style={{ fontSize: '4rem', marginBottom: 14 }}>🎉</div>
          <h2>Order Confirmed!</h2>
          <p>You&apos;ll receive a WhatsApp update when your order is ready.</p>
          <div className="order-id-box">#{order.id}</div>

          <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--muted)', margin: '10px 0' }}>
            👤 {order.customer_name} &nbsp;|&nbsp; 📞 {order.customer_phone}<br />
            📍 {order.address}
          </div>

          {(order.delivery_date || order.delivery_time) && (
            <div style={{ background: '#ede9fe', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textAlign: 'left' }}>
              📅 Scheduled delivery: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
            </div>
          )}

          {/* Live countdown for customer */}
          {(order.status === 'progress' || order.status === 'out') && order.timer_started_at && order.estimated_minutes && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 6, fontWeight: 600 }}>
                {order.status === 'progress' ? '👨‍🍳 Estimated prep time remaining' : '🚚 Estimated delivery time remaining'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>
                <CountdownTimer startedAt={order.timer_started_at} minutes={order.estimated_minutes} />
              </div>
            </div>
          )}

          {/* Order items — customer can see exactly what was ordered (updates if admin edits) */}
          {(() => {
            const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
            return items.length > 0 ? (
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginBottom: 10, textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>YOUR ORDER</div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                    <span>{item.emoji || '🍽️'} {item.name} ×{item.qty}</span>
                    <span style={{ color: 'var(--muted)' }}>₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 6, fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{order.total}</span>
                </div>
              </div>
            ) : null;
          })()}

          <div className="tracking-steps">
            {STEPS.map((step, i) => {
              const done   = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={step.key} className={`step ${done ? 'done' : active ? 'active-step' : ''}`}>
                  <div className="step-dot">{done ? '✓' : i + 1}</div>
                  <div className="step-info"><h5>{step.label}</h5><p>{step.sub}</p></div>
                </div>
              );
            })}
          </div>

          {order.status === 'delivered' && (
            <div className="delivered-prompt">
              <p>✅ Your food has been delivered!</p>
              <small>How was your experience?</small>
              <Link href={`/${slug}/feedback/${order.id}`} className="btn-primary" style={{ marginTop: 0 }}>
                ⭐ Leave Feedback
              </Link>
            </div>
          )}

          <Link href={`/${slug}`} className="btn-outline" style={{ marginTop: 14 }}>Order Again</Link>

          {/* Contact kitchen for any changes */}
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 12, textAlign: 'center' }}>
            Need to change or cancel? Contact the kitchen directly.
          </p>

          {/* Raise a dispute */}
          {order.status !== 'new' && (
            <details style={{ marginTop: 14 }}>
              <summary style={{ fontSize: '0.8rem', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>⚠️ Report an issue with this order</summary>
              <DisputeForm orderId={order.id} kitchenId={order.kitchen_id} customerName={order.customer_name} customerPhone={order.customer_phone} />
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
