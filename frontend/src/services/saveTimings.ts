import { getSupabase } from './supabaseClient';

export interface TimingEntry {
  sessionId: string;
  testType: 'free' | 'timed' | 'multitasking';
  timing: number; // Active typing time in milliseconds
}

/**
 * Save active typing time to Supabase
 * @param entry - Timing entry containing sessionId, testType, and timing in milliseconds
 * @returns Promise with success status
 */
export async function saveTimings(entry: TimingEntry) {
  const supabase = getSupabase();

  const row = {
    session_id: entry.sessionId,
    test_type: entry.testType,
    timing: entry.timing,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('session_timings').insert(row);
  
  if (error) throw error;

  return { success: true };
}

/**
 * Get timing statistics for a specific test type
 * @param testType - Type of test to query
 * @param limit - Maximum number of entries to return (default: 10)
 * @returns Promise with timing data sorted by timing (fastest first)
 */
export async function getTimings(
  testType: 'free' | 'timed' | 'multitasking', 
  limit: number = 10
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('session_timings')
    .select('*')
    .eq('test_type', testType)
    .order('timing', { ascending: true }) // Fastest times first
    .limit(limit);

  if (error) throw error;

  return data || [];
}

/**
 * Get average timing for a specific test type
 * @param testType - Type of test to query
 * @returns Promise with average timing in milliseconds
 */
export async function getAverageTiming(
  testType: 'free' | 'timed' | 'multitasking'
) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('session_timings')
    .select('timing')
    .eq('test_type', testType);

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  const sum = data.reduce((acc, entry) => acc + entry.timing, 0);
  return sum / data.length;
}