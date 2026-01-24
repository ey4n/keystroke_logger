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
    score: entry.score !== undefined ? entry.score : null,
    time_taken: entry.timeTaken !== undefined ? entry.timeTaken : null,
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
    query = query.order('time_taken', { ascending: true, nullsFirst: false });
  } else {
    query = query.order('score', { ascending: false, nullsFirst: false });
  }

  query = query.limit(limit * 2); // Get more entries to filter out nulls

  const { data, error } = await query;

  if (error) throw error;

  if (!data) return [];

  // Sort in JavaScript to ensure NULL values are always last
  const sorted = [...data].sort((a, b) => {
    if (testType === 'timed') {
      // For timed: sort by time ascending, NULLs last
      if (a.time_taken === null && b.time_taken === null) return 0;
      if (a.time_taken === null) return 1; // a goes to end
      if (b.time_taken === null) return -1; // b goes to end
      return a.time_taken - b.time_taken;
    } else {
      // For multitasking: sort by score descending, NULLs last
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1; // a goes to end
      if (b.score === null) return -1; // b goes to end
      return b.score - a.score; // descending
    }
  });

  // Return only entries with valid scores/times, up to the limit
  const validEntries = sorted.filter(entry => 
    testType === 'timed' ? entry.time_taken !== null : entry.score !== null
  );

  // If we have valid entries, return them (up to limit)
  // Otherwise return all entries (including nulls) up to limit
  if (validEntries.length > 0) {
    return validEntries.slice(0, limit);
  }
  
  return sorted.slice(0, limit);
}
