import { getSupabase } from './supabaseClient';

export type KeystrokeEvent = {
  pressed_at: any;
  key: string;
  eventType: 'keydown' | 'keyup';
  sessionId: string;
  testType: string;
  timestamp: number;
  code?: string;
  deviceInfo?: string;
  fieldName?: string;
  challengeId?: number | null;
  elapsedSinceStart?: number | null;
  formSnapshot?: Record<string, unknown>;
};

export async function saveKeystrokesNoAuth(events: KeystrokeEvent[]) {
  const supabase = getSupabase();

  // Map events to explicit table columns matching the schema
  const rows = events.map(e => ({
    key: e.key,
    pressed_at: e.pressed_at ? new Date(e.pressed_at).toISOString() : new Date().toISOString(),
    session_id: e.sessionId, 
    test_type: e.testType,
    event_type: e.eventType,
    device_info: e.deviceInfo ?? navigator.userAgent,
    form_snapshot: e.formSnapshot ?? {},
    field_name: e.fieldName ?? null,
    meta: {
      code: e.code,
      challengeId: e.challengeId,
      elapsedSinceStart: e.elapsedSinceStart,
    },
  }));

  // Batch insert in chunks to respect Supabase limits
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('keystrokes').insert(slice);
    if (error) throw error;
  }

  return { count: rows.length };
}
