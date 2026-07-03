import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // getUser() verifies the JWT server-side (more reliable than getSession())
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Helper: redirect and carry over any refreshed session cookies
  function redirectTo(url) {
    const res = NextResponse.redirect(new URL(url, request.url));
    response.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  }

  // Helper: fetch role only
  async function getRole(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role ?? null;
  }

  async function getPlan(userId) {
    const { data: profile } = await supabase.from('profiles').select('kitchen_id').eq('id', userId).single();
    if (!profile?.kitchen_id) return 'starter';
    const { data: kitchen } = await supabase.from('kitchens').select('plan').eq('id', profile.kitchen_id).single();
    return kitchen?.plan ?? 'starter';
  }

  // --- Protect /admin and /superadmin ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return redirectTo(loginUrl.toString());
    }

    const role = await getRole(user.id);

    if (!role || role === 'customer') return redirectTo('/');
    if (pathname.startsWith('/superadmin') && role !== 'superadmin') return redirectTo('/admin/orders');

    // Plan-gated pages — only check plan when needed
    const GROWTH_ONLY = ['/admin/branding', '/admin/analytics'];
    if (role === 'admin' && GROWTH_ONLY.some((p) => pathname.startsWith(p))) {
      const plan = await getPlan(user.id);
      if (plan === 'starter') return redirectTo('/admin/subscription');
    }
  }

  // --- Redirect logged-in users away from /login ---
  if (pathname === '/login' && user) {
    const role = await getRole(user.id);
    if (role === 'superadmin') return redirectTo('/superadmin');
    if (role === 'admin')      return redirectTo('/admin/orders');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/login'],
};
