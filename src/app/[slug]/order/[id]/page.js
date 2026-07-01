'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

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
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr,  setCancelErr]  = useState('');

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

  // ── CANCELLED VIEW ──────────────────────────────────
  if (order.is_deleted) {
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
              Cancelled by: <b>{order.deleted_by === 'customer' ? 'You' : 'Kitchen Admin'}</b>
              {order.deleted_at && ` · ${new Date(order.deleted_at).toLocaleString('en-IN')}`}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              If this was a mistake, please contact the kitchen directly.
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

          {/* Cancel button — only when order is still 'new' (not yet in kitchen) */}
          {order.status === 'new' && (
            <div style={{ marginTop: 14 }}>
              {cancelErr && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: 'var(--red)', fontSize: '0.85rem', marginBottom: 10 }}>
                  ❌ {cancelErr}
                </div>
              )}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: '2px solid var(--red)', background: '#fff',
                  color: 'var(--red)', fontWeight: 700, fontSize: '0.95rem',
                  cursor: cancelling ? 'wait' : 'pointer', opacity: cancelling ? 0.7 : 1,
                }}
              >
                {cancelling ? 'Cancelling…' : '❌ Cancel Order'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                You can only cancel before the kitchen starts preparing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
