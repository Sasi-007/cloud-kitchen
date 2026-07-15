'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (!profile?.kitchen_id) return;
    getSupabase()
      .from('orders')
      .select('customer_name, customer_phone, address, total, created_at')
      .eq('kitchen_id', profile.kitchen_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        // Aggregate by phone number
        const map = {};
        (data || []).forEach((o) => {
          const key = o.customer_phone;
          if (!map[key]) {
            map[key] = { name: o.customer_name, phone: o.customer_phone, address: o.address, orders: 0, total_spent: 0, last_order: o.created_at };
          }
          map[key].orders++;
          map[key].total_spent += o.total || 0;
          if (o.created_at > map[key].last_order) {
            map[key].last_order = o.created_at;
            map[key].name       = o.customer_name; // use most recent name
            map[key].address    = o.address;
          }
        });
        setCustomers(Object.values(map).sort((a, b) => b.orders - a.orders));
        setLoading(false);
      });
  }, [profile]);

  const filtered = search.trim()
    ? customers.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      )
    : customers;

  const totalOrders  = customers.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const repeat       = customers.filter((c) => c.orders > 1).length;

  if (loading) return <div className="admin-page" style={{ color: 'var(--muted)' }}>Loading customers…</div>;

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <h2>👥 Customers</h2>
        <p>All customers who have ordered from your kitchen</p>
      </div>

      <div className="admin-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--primary)' }}>{customers.length}</div><div className="stat-lbl">Total Customers</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--green)' }}>{repeat}</div><div className="stat-lbl">Repeat Customers</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: '#8b5cf6' }}>{totalOrders}</div><div className="stat-lbl">Total Orders</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--yellow)' }}>₹{totalRevenue.toLocaleString('en-IN')}</div><div className="stat-lbl">Total Revenue</div></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name or phone…"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', fontSize: '0.95rem', background: '#fff' }} />
      </div>

      {!filtered.length && <div className="empty-state"><div className="ico">👥</div><p>No customers found</p></div>}

      {filtered.map((c) => (
        <div key={c.phone} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
              {c.name}
              {c.orders > 1 && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>⭐ Repeat</span>}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 2 }}>
              📞 <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.phone}</a>
            </div>
            {c.address && <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>📍 {c.address}</div>}
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
              Last order: {new Date(c.last_order).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>₹{c.total_spent.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.orders} order{c.orders > 1 ? 's' : ''}</div>
            <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${c.name}! 🍛 Check out our latest menu and special offers!`)}`}
              target="_blank" rel="noreferrer"
              style={{ marginTop: 6, display: 'inline-block', background: '#25d366', color: '#fff', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>
              📱 WhatsApp
            </a>
            <Link href={`/admin/orders?phone=${encodeURIComponent(c.phone)}`} 
              style={{ marginTop: 6, marginLeft: 6, display: 'inline-block', background: '#eff6ff', color: '#1e40af', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none'}}>
                📋 View Orders
              </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
