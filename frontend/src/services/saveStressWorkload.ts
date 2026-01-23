import { getSupabase } from './supabaseClient';
import { StressWorkloadData } from '../components/StressWorkloadForm';

export async function saveStressWorkload(
  sessionId: string,
  testType: string,
  stressData: StressWorkloadData
) {
  const supabase = getSupabase();

  const row = {
    session_id: sessionId,
    test_type: testType,
    stress_level: stressData.stressLevel,
    mental_demand: stressData.mentalDemand,
    rushed_feeling: stressData.rushedFeeling,
    concentration_difficulty: stressData.concentrationDifficulty,
    more_stressed_than_baseline: stressData.moreStressedThanBaseline,
    discomfort_or_distraction: stressData.discomfortOrDistraction || null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('stress_workload').insert(row);
  
  if (error) throw error;

  return { success: true };
}
