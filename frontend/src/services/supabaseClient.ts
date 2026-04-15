import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let clientKey: string | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Missing Supabase env vars');
  }

  const nextKey = `${url}\0${anon}`;
  if (client && clientKey === nextKey) {
    return client;
  }

  clientKey = nextKey;
  client = createClient(url, anon, {
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init ?? {}), cache: 'no-store' }),
    },
  });
  return client;
}
