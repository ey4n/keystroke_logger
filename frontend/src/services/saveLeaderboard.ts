import { getSupabase } from './supabaseClient';

export interface LeaderboardEntry {
  userName: string;
  testType: 'timed' | 'multitasking';
  score?: number; // For multitasking test
  timeTaken?: number; // For timed test (in seconds)
  sessionId: string;
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry) {
  const supabase = getSupabase();

  const row = {
    user_name: entry.userName,
    test_type: entry.testType,
    score: entry.score || null,
    time_taken: entry.timeTaken || null,
    session_id: entry.sessionId,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('leaderboard').insert(row);
  
  if (error) throw error;

  return { success: true };
}

export async function getLeaderboard(testType: 'timed' | 'multitasking', limit: number = 10) {
  const supabase = getSupabase();

  let query = supabase
    .from('leaderboard')
    .select('*')
    .eq('test_type', testType);

  // Sort by time (ascending) for timed test, by score (descending) for multitasking
  if (testType === 'timed') {
    query = query.order('time_taken', { ascending: true });
  } else {
    query = query.order('score', { ascending: false });
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}
