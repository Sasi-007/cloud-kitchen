'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

const STATUS_LABEL = { new: 'Order Placed', progress: 'Preparing', out: 'Out for Delivery', delivered: 'Delivered' };
const STATUS_ICON  = { new: '🟡', progress: '🔵', out: '🚚', delivered: '✅' };
const STATUS_COLOR = { new: '#f59e0b', progress: '#3b82f6', out: '#8b5cf6', delivered: '#22c55e' };

export default function MyOrdersPage({ params }) {
  const { slug } = params;
  const [phone,    setPhone]    = useState('');
  const [orders,   setOrders]   = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function lookup(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(false);
    const { data: kitchen } = await getSupabase().from('kitchens').select('id,name').eq('slug', slug).single();
    if (!kitchen) { setLoading(false); return; }
    const { data } = await getSupabase()
      .from('orders').select('*')
      .eq('kitchen_id', kitchen.id)
      .eq('customer_phone', phone.trim())
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders(data || []);
    setSearched(true);
    setLoading(false);
  }

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

        {/* NO RESULTS */}
        {searched && !orders.length && (
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
          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
          const isRecent = idx === 0;
          return (
            <div key={order.id} style={{
              background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 12,
              boxShadow: isRecent ? '0 4px 20px rgba(255,107,53,0.12)' : '0 1px 8px rgba(0,0,0,0.06)',
              border: isRecent ? '1.5px solid #ffcbb0' : '1px solid #f0f0f0',
            }}>
              {isRecent && (
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Latest Order
                </div>
              )}

              {/* STATUS + DATE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{STATUS_ICON[order.status] || '📋'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: STATUS_COLOR[order.status] }}>
                      {STATUS_LABEL[order.status] || order.status}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--primary)' }}>₹{order.total}</div>
              </div>

              {/* ORDER ID */}
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontFamily: 'monospace' }}>#{order.id}</div>

              {/* ITEMS */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>
                {items.map((i) => `${i.emoji || '🍽️'} ${i.name} ×${i.qty}`).join(' · ')}
              </div>

              {/* DELIVERY SLOT */}
              {(order.delivery_date || order.delivery_time) && (
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', display: 'inline-block', borderRadius: 6, padding: '3px 10px', marginBottom: 10 }}>
                  📅 {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} {order.delivery_time || ''}
                </div>
              )}

              {/* ACTIONS */}
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
                  style={{ background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  📱 Share
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}