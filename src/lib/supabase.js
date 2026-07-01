import { createBrowserClient } from '@supabase/ssr';

let _client = null;

/** Browser-side Supabase client (singleton) */
export function getSupabase() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _client;
}
