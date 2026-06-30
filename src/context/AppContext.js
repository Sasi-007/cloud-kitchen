'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [partySize, setPartySize] = useState(10);
  const [toastData, setToastData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const toastTimer = useRef(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const c = localStorage.getItem('ck_cart');
      const o = localStorage.getItem('ck_orders');
      if (c) setCart(JSON.parse(c));
      if (o) setOrders(JSON.parse(o));
    } catch {}
    setMounted(true);
  }, []);

  // Persist cart
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('ck_cart', JSON.stringify(cart));
  }, [cart, mounted]);

  // Persist orders
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('ck_orders', JSON.stringify(orders));
  }, [orders, mounted]);

  const addItem = useCallback((item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + 1 },
    }));
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) => {
      const qty = (prev[id]?.qty || 0) + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...prev[id], qty } };
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const addOrder = useCallback((order) => {
    setOrders((prev) => [...prev, order]);
  }, []);

  const updateOrderStatus = useCallback((id, status) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastData({ msg, type });
    toastTimer.current = setTimeout(() => setToastData(null), 3000);
  }, []);

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        addItem,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
        orders,
        addOrder,
        updateOrderStatus,
        partySize,
        setPartySize,
        toastData,
        showToast,
        mounted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
