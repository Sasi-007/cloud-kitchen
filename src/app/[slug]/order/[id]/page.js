'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import CountdownTimer from '@/components/CountdownTimer';

/* ── Dispute section ────────────────────────────────────────── */
function DisputeSection({ orderId, kitchenId, customerName, customerPhone }) {
  const [dispute,  setDispute]  = useState(null);  // existing dispute if any
  const [loadingD, setLoadingD] = useState(true);
  const [type,     setType]     = useState('payment');
  const [desc,     setDesc]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getSupabase().from('disputes').select('*').eq('order_id', orderId).maybeSingle()
      .then(({ data }) => { setDispute(data); setLoadingD(false); });
  }, [orderId]);

  if (loadingD) return null;

  const STATUS_LABEL = { open: '🟡 Under Review', reviewing: '🔵 Being Reviewed', resolved: '✅ Resolved', closed: '⚫ Closed' };
  const STATUS_COLOR = { open: '#854d0e', reviewing: '#1e40af', resolved: '#166534', closed: '#6b7280' };
  const STATUS_BG    = { open: '#fef9c3', reviewing: '#dbeafe', resolved: '#dcfce7', closed: '#f3f4f6' };

  /* Already raised a dispute for this order */
  if (dispute) {
    return (
      <div style={{ marginTop: 20, background: '#f9fafb', borderRadius: 14, padding: '16px 18px', border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>⚠️ Your Dispute</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{dispute.type} issue</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: STATUS_BG[dispute.status], color: STATUS_COLOR[dispute.status] }}>
            {STATUS_LABEL[dispute.status] || dispute.status}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: 8 }}>{dispute.description}</p>
        {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            The kitchen will contact you via WhatsApp to resolve this.
          </div>
        )}
        {(dispute.status === 'resolved' || dispute.status === 'closed') && (
          <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>✅ This dispute has been resolved.</div>
        )}
      </div>
    );
  }

  /* No dispute yet */
  return (
    <div style={{ marginTop: 20 }}>
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600, width: '100%' }}>
          ⚠️ Report an issue with this order
        </button>
      ) : (
        <div style={{ background: '#f9fafb', borderRadius: 14, padding: '16px 18px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>⚠️ Report an Issue</div>
          <select value={type} onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff', marginBottom: 8 }}>
            <option value="payment">💳 Payment Issue</option>
            <option value="delivery">🚚 Delivery Issue</option>
            <option value="quality">🍽️ Food Quality Issue</option>
            <option value="other">⚠️ Other</option>
          </select>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Describe the issue…"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.95rem', resize: 'none', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
            <button disabled={saving || !desc.trim()} onClick={async () => {
              setSaving(true);
              const { data } = await getSupabase().from('disputes').insert({
                order_id: orderId, kitchen_id: kitchenId,
                customer_name: customerName, customer_phone: customerPhone,
                type, description: desc,
              }).select().single();
              setDispute(data); setSaving(false); setShowForm(false);
            }} style={{ flex: 2, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: (!desc.trim() || saving) ? 0.6 : 1 }}>
              {saving ? 'Submitting…' : '📩 Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [couponDetails, setCouponDetails] = useState(null);

  useEffect(() => {
    const supabase = getSupabase();
    async function loadOrder() {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) {
        setOrder(data);
        if (data.coupon_code) {
          const { data: c } = await supabase.from('coupons').select('type,value,code')
            .eq('code',data.coupon_code).single();
          if(c) setCouponDetails(c);
        }
      }
      setLoading(false);
    }
    loadOrder();
    const channel = supabase.channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => setOrder(payload.new))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) return (
    <div className="page">
      <div className="success-wrap">
        <div className="success-card" style={{ padding: '28px 24px'}}>
          <div style={{ width: 60,height: 60, borderRadius: '50%', background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.4s infinite', margin: '0 auto 16px'}}/>
          <div style={{ height: 22,width: '60%', borderRadius: 8, background: '#e5e7eb', margin: '0 auto 12px', backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}}/>
          <div style={{ height: 40, borderRadius: 10, background: '#f0f0f0', backgroundSize: '200%', animation: 'shimmer 1.4s infinite', marginBottom: 16}}/>
          <div style={{ width: '80%',height: 14, borderRadius: 6, background: '#f0f0f0', backgroundSize: '200%', animation: 'shimmer 1.4s infinite', margin: '0 auto 8px'}}/>
          <div style={{ width: '60%',height: 14, borderRadius: 6, background: '#f0f0f0', backgroundSize: '200%', animation: 'shimmer 1.4s infinite', margin: '0 auto 24px'}}/>
          {[1,2,3,4].map(i=> (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5'}}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb',flexShrink: 0, backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: '50%', borderRadius: 6, background: '#e5e7eb', marginBottom: 6, animation: 'shimmer 1.4s infinite', backgroundSize: '200%'}} />
              <div style={{ height: 11, width: '70%', borderRadius: 6, background: '#f0f0f0', animation: 'shimmer 1.4s infinite', backgroundSize: '200%'}} />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
  if (!order)  return <div className="page empty-state"><div className="ico">🔍</div><p>Order not found</p></div>;

  // ── CANCELLED VIEW ───────────────────────────────────────────
  if (order.is_deleted || order.status === 'cancelled') {
    return (
      <div className="page">
        <div className="success-wrap">
          <div className="success-card">
            <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>❌</div>
            <h2 style={{ color: 'var(--red)' }}>Order Cancelled</h2>
            <div className="order-id-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: 'var(--red)' }}>#{order.id}</div>
            <p style={{ color: 'var(--muted)', margin: '12px 0', fontSize: '0.9rem' }}>
              This order has been cancelled. Contact the kitchen if you need help.
            </p>
            {order.advance_paid && order.advance_amount > 0 && (
              <div style={{ background: order.refund_status === 'completed' ? '#dcfce7' : '#fef9c3', border: `1px solid ${order.refund_status === 'completed' ? '#86efac' : '#fde68a'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: order.refund_status === 'completed' ? '#166534' : '#854d0e' }}>
                {order.refund_status === 'completed' ? `✅ Refund of ₹${order.advance_amount} processed. Please check your account.` : `💰 Advance ₹${order.advance_amount} refund is pending.`}
              </div>
            )}
            <Link href={`/${slug}`} className="btn-primary">Order Again</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── NORMAL TRACKING VIEW ─────────────────────────────────────
  const currentIndex  = STATUS_INDEX[order.status] ?? 0;
  const isDelivered   = order.status === 'delivered';
  const items         = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');

  return (
    <div className="page">
      <div className="success-wrap">
        <div className="success-card">
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>{isDelivered ? '🎊' : '🎉'}</div>
          <h2>{isDelivered ? 'Order Delivered!' : 'Order Confirmed!'}</h2>
          {/* Issue 3: Removed "You'll receive WhatsApp update" */}
          <div className="order-id-box">#{order.id}</div>

          <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--muted)', margin: '10px 0' }}>
            👤 {order.customer_name} &nbsp;|&nbsp; 📞 {order.customer_phone}<br />
            📍 {order.address}
          </div>

          {(order.delivery_date || order.delivery_time) && (
            <div style={{ background: '#ede9fe', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textAlign: 'left' }}>
              📅 Scheduled: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
            </div>
          )}

          {/* Countdown timer */}
          {(order.status === 'progress' || order.status === 'out') && order.timer_started_at && order.estimated_minutes && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 6, fontWeight: 600 }}>
                {order.status === 'progress' ? '👨‍🍳 Prep time remaining' : '🚚 Delivery time remaining'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>
                <CountdownTimer startedAt={order.timer_started_at} minutes={order.estimated_minutes} />
              </div>
            </div>
          )}

          {/* Order items */}
          {items.length > 0 && (
            <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '12px 14px', marginBottom: 12, textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>YOUR ORDER</div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                  <span>{item.emoji || '🍽️'} {item.name} ×{item.qty}</span>
                  <span style={{ color: 'var(--muted)' }}>₹{item.price * item.qty}</span>
                </div>
              ))}
            {(() => {
              const itemsTotal = items.reduce((s,i) => s + i.price * i.qty, 0);
              const discount = order.discount_amount > 0 ? order.discount_amount : 0;
              const delivery = order.total + discount - itemsTotal;
              const showBreakdown = delivery > 0 || discount > 0;
              return (
                <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 6}}>
                  {showBreakdown && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4}}>
                      <span>Subtotal</span><span>₹{itemsTotal}</span>
                    </div>
                  )}
                  {delivery > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4}}>
                      <span>🚚 Delivery</span><span>+₹{delivery}</span>
                    </div>
                  )}
                  {discount > 0 && (() => {
                    let label = '💰 Admin Discount';
                    let sublabel = null;
                    if (order.coupon_code) {
                      if (couponDetails) {
                        const typeLabel = couponDetails.type === 'percent' ? `${couponDetails.value}% off` : `₹${couponDetails.value} off`;
                        label = `🎟️ ${order.coupon_code}(${typeLabel})`;
                      } else {
                        label = `🎟️ Coupon (${order.coupon_code})`;
                      }
                    } else if (order.discount_note) {
                      label = '💰 Admin Discount';
                      sublabel = order.discount_note;
                    }
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--green)', fontWeight: 700, marginBottom: sublabel ? 2 : 4 }}>
                          <span>{label}</span>
                          <span>-₹{discount}</span>
                        </div>
                        {sublabel && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4, paddingLeft: 4 }}>
                            {sublabel}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', paddingTop: showBreakdown ? 6 : 0, borderTop: showBreakdown ? '1px solid #eee' : 'none'}}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)'}}>₹{order.total}</span>
                  </div>
                </div>
              );
            })()}
            </div>
          )}

          {/* Issue 5: Tracking steps — all ticked when delivered */}
          <div className="tracking-steps">
            {STEPS.map((step, i) => {
              const done   = isDelivered ? true : i < currentIndex;
              const active = !isDelivered && i === currentIndex;
              return (
                <div key={step.key} className={`step ${done ? 'done' : active ? 'active-step' : ''}`}>
                  <div className="step-dot">{done ? '✓' : i + 1}</div>
                  <div className="step-info"><h5>{step.label}</h5><p>{step.sub}</p></div>
                </div>
              );
            })}
          </div>

          {/* Issue 6: Feedback — link only when delivered */}
          {isDelivered && (
            <div className="delivered-prompt">
              <p>✅ Your food has been delivered!</p>
              <small>How was your experience?</small>
              <Link href={`/${slug}/feedback/${order.id}`} className="btn-primary" style={{ marginTop: 0 }}>
                ⭐ Leave Feedback
              </Link>
            </div>
          )}

          <Link href={`/${slug}`} className="btn-outline" style={{ marginTop: 14 }}>Order Again</Link>

          {/* Issue 9 & 10: Show dispute — available from progress onwards, hidden for new/cancelled */}
          {(order.status === 'progress' || order.status === 'out' || isDelivered) && (
            <DisputeSection
              orderId={order.id}
              kitchenId={order.kitchen_id}
              customerName={order.customer_name}
              customerPhone={order.customer_phone}
            />
          )}
        </div>
      </div>
    </div>
  );
}
