'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const STEPS = [
  { key: 'new',       label: 'Order Placed',       sub: 'Kitchen notified via WhatsApp' },
  { key: 'progress',  label: 'Preparing',           sub: 'Kitchen is cooking your order'   },
  { key: 'out',       label: 'Out for Delivery',    sub: 'On the way to you'               },
  { key: 'delivered', label: 'Delivered 🎊',        sub: 'Enjoy your meal!'                },
];

const STATUS_INDEX = { new: 0, progress: 1, out: 2, delivered: 3 };

export default function OrderPage({ params }) {
  const { orders } = useApp();
  const [order, setOrder] = useState(null);

  // Sync from context + poll localStorage for cross-tab admin updates
  useEffect(() => {
    function load() {
      try {
        const stored = JSON.parse(localStorage.getItem('ck_orders') || '[]');
        const found = stored.find((o) => o.id === params.id);
        if (found) setOrder(found);
      } catch {}
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  // Also sync from context state (same tab)
  useEffect(() => {
    const found = orders.find((o) => o.id === params.id);
    if (found) setOrder(found);
  }, [orders, params.id]);

  if (!order) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="ico">🔍</div>
          <p>Order not found</p>
          <Link href="/" className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Back to Menu</Link>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[order.status] ?? 0;

  return (
    <div className="page">
      <div className="success-wrap">
        <div className="success-card">
          <div style={{ fontSize: '4rem', marginBottom: 14 }}>🎉</div>
          <h2>Order Placed!</h2>
          <p>Your order is confirmed. You&apos;ll receive a WhatsApp update shortly.</p>

          <div className="order-id-box">#{order.id}</div>

          <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 6 }}>
            👤 {order.name} &nbsp;|&nbsp; 📞 {order.phone}<br />
            📍 {order.address}
          </div>

          {/* TRACKING STEPS */}
          <div className="tracking-steps">
            {STEPS.map((step, i) => {
              const done   = i < currentIndex;
              const active = i === currentIndex;
              const cls    = done ? 'step done' : active ? 'step active-step' : 'step';
              return (
                <div key={step.key} className={cls}>
                  <div className="step-dot">{done ? '✓' : i + 1}</div>
                  <div className="step-info">
                    <h5>{step.label}</h5>
                    <p>{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {order.status === 'delivered' && (
            <div className="delivered-prompt">
              <p>✅ Your food has been delivered!</p>
              <small>How was your experience?</small>
              <Link href={`/feedback/${order.id}`} className="btn-primary" style={{ marginTop: 0 }}>
                ⭐ Leave Feedback
              </Link>
            </div>
          )}

          <Link href="/" className="btn-outline" style={{ marginTop: 14 }}>
            Order Again
          </Link>
        </div>
      </div>
    </div>
  );
}
