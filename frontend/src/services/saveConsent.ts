import { getSupabase } from './supabaseClient';
import { ConsentData } from '../components/ConsentForm';

export async function saveConsent(sessionId: string, consentData: ConsentData) {
  const supabase = getSupabase();

  const row = {
    session_id: sessionId,
    consent_given: consentData.consentGiven,
    device_type: consentData.deviceType,
    primary_language: consentData.primaryLanguage,
    language_other: consentData.languageOther || null,
    browser: consentData.browser,
    location: consentData.location,
    noise_level: consentData.noiseLevel,
    sitting_or_standing: consentData.sittingOrStanding,
    time_of_day: consentData.timeOfDay,
    sleep_last_night: consentData.sleepLastNight ? parseFloat(consentData.sleepLastNight) : null,
    caffeine_last_6_hours: consentData.caffeineLast6Hours,
    current_mood_baseline: consentData.currentMoodBaseline,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('consent_data').insert(row);
  
  if (error) throw error;

  return { success: true };
}
