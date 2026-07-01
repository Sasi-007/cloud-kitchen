'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

const STATUS_LABEL = { new: '🟡 Order Placed', progress: '🔵 Preparing', out: '🚚 Out for Delivery', delivered: '✅ Delivered' };
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

    // Fetch kitchen first to get kitchen_id (ensures cross-kitchen isolation)
    const { data: kitchen } = await getSupabase()
      .from('kitchens').select('id').eq('slug', slug).single();

    if (!kitchen) { setLoading(false); return; }

    const { data } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('kitchen_id', kitchen.id)
      .eq('customer_phone', phone.trim())
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    setOrders(data || []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>🔍 Track My Orders</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>
          Enter the phone number you used while ordering
        </p>

        <form onSubmit={lookup} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9999999999"
            required
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '1rem' }}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 20px', margin: 0 }} disabled={loading}>
            {loading ? '…' : 'Search'}
          </button>
        </form>

        {searched && !orders.length && (
          <div className="empty-state">
            <div className="ico">📋</div>
            <p>No orders found for this number</p>
            <small style={{ color: 'var(--muted)' }}>Make sure you enter the same number used at checkout</small>
          </div>
        )}

        {orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
          return (
            <div key={order.id} className="order-card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>#{order.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  background: STATUS_COLOR[order.status] + '20', color: STATUS_COLOR[order.status]
                }}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
                {items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.total}</div>
                <Link href={`/${slug}/order/${order.id}`} className="action-btn accept" style={{ fontSize: '0.82rem' }}>
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
