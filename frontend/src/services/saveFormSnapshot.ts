import { getSupabase } from './supabaseClient';

export type FormSnapshotPayload = {
  sessionId: string;
  testType: 'free' | 'timed' | 'multitasking';
  formSnapshot: Record<string, unknown>;
};

export async function saveFormSnapshot({ sessionId, testType, formSnapshot }: FormSnapshotPayload) {
  const supabase = getSupabase();

  const row = {
    session_id: sessionId,
    test_type: testType,
    form_snapshot: formSnapshot,
  };

  const { error } = await supabase
    .from('form_snapshots')
    .upsert(row, { onConflict: 'session_id,test_type' });

  if (error) throw error;
}
