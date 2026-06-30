'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { toastData } = useApp();
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (toastData) {
      setHiding(false);
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setHiding(true);
        setTimeout(() => setVisible(false), 280);
      }, 2800);
    }
  }, [toastData]);

  if (!visible || !toastData) return null;

  const isWarn    = toastData.msg.startsWith('⚠️');
  const isSuccess = toastData.msg.includes('added') || toastData.msg.includes('Delivered') || toastData.msg.includes('Progress');
  const icon      = isWarn ? '⚠️' : isSuccess ? '✅' : '🔔';
  const color     = isWarn ? '#f59e0b' : isSuccess ? 'var(--green)' : 'var(--primary)';

  return (
    <div
      className={`toast ${hiding ? 'toast-hide' : 'toast-show'}`}
      style={{ borderLeftColor: color }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span className="toast-msg">{toastData.msg.replace(/^⚠️\s?/, '')}</span>
      <div className="toast-bar" style={{ background: color }} />
    </div>
  );
}
