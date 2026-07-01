'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Suspense } from 'react';

function LoginForm() {
  const { login } = useAuth();
  const router     = useRouter();
  const params     = useSearchParams();
  const redirect   = params.get('redirect') || '/admin/orders';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(email, password);
      if (user) {
        const { data: profile } = await (await import('@/lib/supabase')).getSupabase().from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'superadmin') router.push('/superadmin');
        else if(profile?.role === 'admin') router.push(redirect === '/admin/orders' ? '/admin/orders' : redirect);
        else setError('You do not have access to the admin panel.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 16
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 32px',
        width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem' }}>🍛</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>
            SpiceFest
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Kitchen Admin Login
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input
              type="email" value={email} required autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@spicefest.com"
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input
              type="password" value={password} required autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
              padding: '10px 14px', color: 'var(--red)', fontSize: '0.85rem', marginBottom: 14
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit" className="btn-primary"
            style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--muted)' }}>
          Customer?{' '}
          <a href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Order here →
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
