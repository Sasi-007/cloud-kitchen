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

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  function redirectTo(url) {
    const res = NextResponse.redirect(new URL(url, request.url));
    response.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  }

  async function getRole(userId) {
    const {data} = await supabase
      .from('profiles')
      .select('role')
      .eq('id',userId)
      .single();
    return data?.role ?? null;
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

    if (pathname.startsWith('/superadmin') && role !== 'superadmin') {
      return redirectTo('/admin/orders');
    }
  }

  if (pathname === '/login' && user) {
    const role = await getRole(user.id);
    if (role === 'superadmin') return redirectTo('/superadmin');
    if (role === 'admin') return redirectTo('/admin/orders');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*', '/login'],
};
