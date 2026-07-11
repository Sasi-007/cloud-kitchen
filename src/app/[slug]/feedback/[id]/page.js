'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

const QUICK_TAGS = ['🍛 Food was great','⚡ Fast delivery','🌡️ Food was hot','📦 Good packaging','😐 Average','🐌 Delayed delivery'];

export default function FeedbackPage({ params }) {
  const { slug, id } = params;
  const [rating,    setRating]    = useState(0);
  const [tags,      setTags]      = useState([]);
  const [comment,   setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [existing,  setExisting]  = useState(null); // existing feedback if already given
  const [checking,  setChecking]  = useState(true);

  // Check if feedback already exists for this order
  useEffect(() => {
    getSupabase().from('feedback').select('*').eq('order_id', id).limit(1)
      .then(({ data }) => { setExisting(data?.[0] || null); setChecking(false); });
  }, [id]);

  function toggleTag(tag) {
    setTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);
  }

  async function submit() {
    if (!rating) { alert('Please select a rating'); return; }
    setLoading(true);

    // Fetch kitchen_id so analytics can filter by kitchen
    const { data: kitchen } = await getSupabase()
      .from('kitchens').select('id').eq('slug', slug).single();

    await getSupabase().from('feedback').insert({
      order_id: id,
      kitchen_id: kitchen?.id,
      rating,
      tags,
      comment,
    });
    setSubmitted(true);
  }

  if (checking) return <div className="page" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--muted)' }}>Loading…</div>;

  // Show existing feedback if already submitted
  if (existing && !submitted) return (
    <div className="page" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⭐</div>
      <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 8 }}>You already reviewed this order</h2>
      <div style={{ marginBottom: 12 }}>
        {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '1.6rem', color: n <= existing.rating ? '#f59e0b' : '#e5e7eb' }}>★</span>)}
      </div>
      {existing.comment && <p style={{ color: 'var(--muted)', fontStyle: 'italic', marginBottom: 8 }}>"{existing.comment}"</p>}
      {existing.tags?.length > 0 && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: 16 }}>{existing.tags.join(' · ')}</p>}
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 24 }}>Your feedback has been received. Thank you!</p>
      <Link href={`/${slug}`} className="btn-primary" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>Back to Menu</Link>
    </div>
  );

  if (submitted) return (
    <div className="page" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>🙏</div>
      <h2 style={{ fontWeight: 800, fontSize: '1.6rem', marginBottom: 10 }}>Thank You!</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Your feedback helps us serve better.</p>
      <Link href={`/${slug}`} className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>Order Again</Link>
    </div>
  );

  return (
    <div className="page">
      <div className="feedback-wrap">
        <div className="feedback-card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>😊</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>How was your experience?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 6 }}>Order #{id}</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Overall Rating</div>
            <div className="stars">
              {[1,2,3,4,5].map((n) => (
                <span key={n} className={`star ${rating >= n ? 'active' : ''}`} onClick={() => setRating(n)}>⭐</span>
              ))}
            </div>
          </div>

          <div className="divider" />
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Quick Feedback</div>
          <div className="quick-tags">
            {QUICK_TAGS.map((tag) => (
              <span key={tag} className={`quick-tag ${tags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleTag(tag)}>{tag}</span>
            ))}
          </div>

          <div className="form-group">
            <label>ADDITIONAL COMMENTS (optional)</label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us more…" />
          </div>

          <button className="btn-primary" onClick={submit} disabled={loading} style={{ opacity: rating ? 1 : 0.5 }}>
            {loading ? 'Submitting…' : 'Submit Feedback 🙏'}
          </button>
        </div>
      </div>
    </div>
  );
}
