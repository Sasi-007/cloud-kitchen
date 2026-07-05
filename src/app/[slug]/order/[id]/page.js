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

          {(order.delivery_date || order.delivery_time) && (
            <div style={{ background: '#ede9fe', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textAlign: 'left' }}>
              📅 Scheduled delivery: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
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
        </div>
      </div>
    </div>
  );
}
