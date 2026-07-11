'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

const STATUS_LABEL = { new: 'Order Placed', progress: 'Preparing', out: 'Out for Delivery', delivered: 'Delivered' };
const STATUS_ICON  = { new: '🟡', progress: '🔵', out: '🚚', delivered: '✅' };
const STATUS_COLOR = { new: '#f59e0b', progress: '#3b82f6', out: '#8b5cf6', delivered: '#22c55e' };

export default function MyOrdersPage({ params }) {
  const { slug } = params;
  const [phone,    setPhone]    = useState('');
  const [orders,   setOrders]   = useState([]);
  const [customs,  setCustoms]  = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function lookup(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(false);
    const { data: kitchen } = await getSupabase().from('kitchens').select('id,name').eq('slug', slug).single();
    if (!kitchen) { setLoading(false); return; }

    const [{ data: ord }, { data: cust }] = await Promise.all([
      getSupabase().from('orders').select('*').eq('kitchen_id', kitchen.id)
        .eq('customer_phone', phone.trim()).eq('is_deleted', false)
        .order('created_at', { ascending: false }).limit(20),
      // Issue 4: Only show custom requests that are NOT yet confirmed (confirmed = real order created)
      getSupabase().from('custom_requests').select('*').eq('kitchen_id', kitchen.id)
        .eq('phone', phone.trim()).neq('status', 'confirmed').order('created_at', { ascending: false }).limit(10),
    ]);

    setOrders(ord || []);
    setCustoms(cust || []);
    setSearched(true);
    setLoading(false);

    // Issue 12: Cache phone in sessionStorage so user doesn't retype
    try { sessionStorage.setItem(`orders_phone_${slug}`, phone.trim()); } catch {}
  }

  // Issue 12: Auto-fill + auto-search from session cache on page load
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`orders_phone_${slug}`);
      if (cached) {
        setPhone(cached);
        // Directly run the lookup with the cached phone (no form submit needed)
        setLoading(true);
        getSupabase().from('kitchens').select('id').eq('slug', slug).single().then(({ data: kitchen }) => {
          if (!kitchen) { setLoading(false); return; }
          Promise.all([
            getSupabase().from('orders').select('*').eq('kitchen_id', kitchen.id)
              .eq('customer_phone', cached).eq('is_deleted', false)
              .order('created_at', { ascending: false }).limit(20),
            getSupabase().from('custom_requests').select('*').eq('kitchen_id', kitchen.id)
              .eq('phone', cached).neq('status', 'confirmed').order('created_at', { ascending: false }).limit(10),
          ]).then(([{ data: ord }, { data: cust }]) => {
            setOrders(ord || []);
            setCustoms(cust || []);
            setSearched(true);
            setLoading(false);
          });
        });
      }
    } catch {}
  }, [slug]);

  return (
    <div className="page">
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📦</div>
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: 6 }}>My Orders</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Enter your phone number to see all your orders</p>
        </div>

        {/* PHONE LOOKUP */}
        <form onSubmit={lookup} style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: 1 }}>PHONE NUMBER</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9999999999" required
              style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 20px', margin: 0 }} disabled={loading}>
              {loading ? '⏳' : 'Find Orders'}
            </button>
          </div>
        </form>

        {loading && (
          <div>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ height: 16,width: '45%', borderRadius: 6, background: 'linear-gradient(90deg, #f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}}/>
                  <div style={{ height: 16,width: '20%', borderRadius: 6, background: 'linear-gradient(90deg, #f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}}/>
                </div>
                  <div style={{ height: 12,width: '80%', borderRadius: 6, background: '#f0f0f0', marginBottom: 8, backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}}/>
                  <div style={{ height: 12,width: '60%', borderRadius: 6, background: '#f0f0f0', backgroundSize: '200%', animation: 'shimmer 1.4s infinite'}}/>
                </div>
            ))}
          </div>
        )}

        {/* NO RESULTS */}
        {!loading && searched && !orders.length && !customs.length && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No orders found</div>
            <div style={{ fontSize: '0.85rem' }}>Make sure you enter the same number used at checkout</div>
          </div>
        )}

        {/* ORDER LIST — recent first */}
        {orders.length > 0 && (
          <div style={{ marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </div>
        )}

        {orders.map((order, idx) => {
          const items       = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
          const isCancelled = order.status === 'cancelled' || order.is_deleted;
          const isRecent    = idx === 0 && !isCancelled;
          return (
            <div key={order.id} style={{
              background:   isCancelled ? '#fef2f2' : '#fff',
              borderRadius: 16, padding: '18px 20px', marginBottom: 12,
              boxShadow:    isRecent ? '0 4px 20px rgba(255,107,53,0.12)' : '0 1px 8px rgba(0,0,0,0.06)',
              border:       isCancelled ? '1.5px solid #fca5a5' : isRecent ? '1.5px solid #ffcbb0' : '1px solid #f0f0f0',
              opacity:      isCancelled ? 0.88 : 1,
            }}>
              {isRecent && (
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Latest Order
                </div>
              )}
              {isCancelled && (
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  ❌ ORDER CANCELLED
                </div>
              )}

              {/* STATUS + DATE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{isCancelled ? '❌' : (STATUS_ICON[order.status] || '📋')}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isCancelled ? '#dc2626' : STATUS_COLOR[order.status] }}>
                      {isCancelled ? 'Cancelled' : (STATUS_LABEL[order.status] || order.status)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: isCancelled ? '#dc2626' : 'var(--primary)', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                  ₹{order.total}
                </div>
              </div>

              {/* ORDER ID */}
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontFamily: 'monospace' }}>#{order.id}</div>

              {/* ITEMS — dimmed if cancelled */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: 8, lineHeight: 1.5, opacity: isCancelled ? 0.55 : 1 }}>
                {items.map((i) => `${i.emoji || '🍽️'} ${i.name} ×${i.qty}`).join(' · ')}
              </div>

              {/* DELIVERY DETAILS — only for active orders */}
              {!isCancelled && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {order.address && <span>📍 {order.address}</span>}
                  {order.note && <span>📝 {order.note}</span>}
                </div>
              )}

              {/* DELIVERY SLOT */}
              {!isCancelled && (order.delivery_date || order.delivery_time) && (
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', display: 'inline-block', borderRadius: 6, padding: '3px 10px', marginBottom: 10 }}>
                  📅 {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
                </div>
              )}

              {/* ADVANCE REFUND NOTICE */}
              {isCancelled && order.advance_paid && order.advance_amount > 0 && (
                <div style={{
                  background: order.refund_status === 'completed' ? '#dcfce7' : '#fef9c3',
                  border: `1px solid ${order.refund_status === 'completed' ? '#86efac' : '#fde68a'}`,
                  borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: '0.82rem',
                  color: order.refund_status === 'completed' ? '#166534' : '#854d0e',
                }}>
                  {order.refund_status === 'completed'
                    ? `✅ Refund of ₹${order.advance_amount} has been processed. Please check your account.`
                    : `💰 You paid advance ₹${order.advance_amount}. Your refund is pending — the kitchen will process it soon.`
                  }
                </div>
              )}

              {/* ACTIONS */}
              {!isCancelled ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link href={`/${slug}/order/${order.id}`} style={{
                    flex: 1, textAlign: 'center', textDecoration: 'none',
                    background: 'var(--primary)', color: '#fff', borderRadius: 10,
                    padding: '9px 14px', fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    Track Order →
                  </Link>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Track my order #${order.id}: ${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/order/${order.id}`)}`}
                    target="_blank" rel="noreferrer"
                    style={{ background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                    📱 Share
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#dc2626', marginTop: 4 }}>
                  Have questions? Contact the kitchen directly.
                </div>
              )}

            </div>
          );
        })}

        {/* CUSTOM ORDER REQUESTS */}
        {customs.length > 0 && (
          <>
            {(orders.length > 0) && <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 10, fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Custom Requests</div>}
            {customs.map((r) => {
              const items = Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]');
              const CSTATUS = { new: '🟡 Pending Review', reviewing: '🔵 Being Reviewed', quoted: '💬 Quoted', confirmed: '✅ Confirmed', rejected: '⚫ Declined' };
              const CCOLOR  = { new: '#f59e0b', reviewing: '#3b82f6', quoted: '#8b5cf6', confirmed: '#22c55e', rejected: '#6b7280' };
              return (
                <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Custom Order Request</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: (CCOLOR[r.status] || '#999') + '20', color: CCOLOR[r.status] || '#999', whiteSpace: 'nowrap' }}>
                      {CSTATUS[r.status] || r.status}
                    </span>
                  </div>

                  {/* Item boxes */}
                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 10, padding: '8px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.emoji || '🍽️'} {item.name} {item.qty > 1 && `×${item.qty}`}</div>
                          {item.note && <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontStyle: 'italic', marginTop: 2 }}>"{item.note}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {r.requirements && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 6 }}>💬 "{r.requirements}"</div>}
                  {r.event_date && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📅 Event: {new Date(r.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  {r.total > 0 && <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>₹{r.total}</div>}
                </div>
              );
            })}
          </>
        )}

        {searched && orders.length === 0 && customs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No orders found</div>
            <div style={{ fontSize: '0.85rem' }}>Make sure you enter the same number used at checkout</div>
          </div>
        )}
      </div>
    </div>
  );
}
