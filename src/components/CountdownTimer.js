'use client';
import { useEffect, useState } from 'react';

/**
 * Live countdown timer.
 * Props: startedAt (ISO string), minutes (integer)
 * Shows MM:SS counting down, green→yellow→red as time reduces
 */
export default function CountdownTimer({ startedAt, minutes }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!startedAt || !minutes) return;
    const endMs = new Date(startedAt).getTime() + minutes * 60 * 1000;

    function tick() {
      const diff = endMs - Date.now();
      setRemaining(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, minutes]);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return (
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '2px 8px' }}>
        ⏰ Time up
      </span>
    );
  }

  const totalSecs = Math.floor(remaining / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  const pct = remaining / (minutes * 60 * 1000); // 1 → 0

  const color = pct > 0.5 ? '#16a34a' : pct > 0.25 ? '#d97706' : '#dc2626';
  const bg    = pct > 0.5 ? '#dcfce7' : pct > 0.25 ? '#fef9c3' : '#fef2f2';

  return (
    <span style={{ fontSize: '0.78rem', fontWeight: 800, color, background: bg, borderRadius: 6, padding: '2px 10px', fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}>
      ⏱ {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}
