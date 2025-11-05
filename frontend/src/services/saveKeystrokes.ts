import { getSupabase } from './supabaseClient';

export type KeystrokeEvent = {
  key: string;
  pressed_at?: string | Date;
  latency_ms?: number | null;
  meta?: Record<string, unknown>;
};

export async function saveKeystrokesNoAuth(events: KeystrokeEvent[], testType?: string) {
  const supabase = getSupabase(); 

  const rows = events.map(e => ({
    key: e.key,
    pressed_at: e.pressed_at ? new Date(e.pressed_at).toISOString() : new Date().toISOString(),
    latency_ms: e.latency_ms ?? null,
    meta: { ...(e.meta ?? {}), testType: testType ?? null },
  }));

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('keystrokes').insert(slice);
    if (error) throw error;
  }
  return { count: rows.length };
}