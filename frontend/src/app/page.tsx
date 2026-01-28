'use client';

import React, { useState, useEffect } from 'react';
import TestContainer from '../components/TestContainer';
import { ConsentForm } from '../components/ConsentForm';
import { saveConsent } from '../services/saveConsent';

interface ConsentData {
  consentGiven: boolean;
  deviceType: string;
  primaryLanguage: string;
  languageOther?: string;
  browser: string;
  location: string;
  noiseLevel: string;
  sittingOrStanding: string;
  timeOfDay: string;
  sleepLastNight: string;
  caffeineLast6Hours: string;
  currentMoodBaseline: number | null;
}

export default function Page() {
  const [hasConsent, setHasConsent] = useState(false);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Generate session ID once on mount
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const id = globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`;
      setSessionId(id);
      sessionStorage.setItem('session_id', id);
    }
  }, []);

  // Check for existing consent on mount (using sessionStorage so it doesn't persist across refreshes)
  useEffect(() => {
    const stored = sessionStorage.getItem('keystroke_consent');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.consentGiven) {
          setConsentData(data);
          setHasConsent(true);
        } else {
          // Consent was revoked, clear it
          sessionStorage.removeItem('keystroke_consent');
        }
      } catch (e) {
        // Invalid stored data, show consent form
        sessionStorage.removeItem('keystroke_consent');
      }
    }
  }, []);

  const handleConsent = async (data: ConsentData) => {
    setConsentData(data);
    setHasConsent(true);
    // Store in sessionStorage (cleared when browser tab closes)
    sessionStorage.setItem('keystroke_consent', JSON.stringify(data));
    
    // Save consent data to Supabase if we have a sessionId
    if (sessionId) {
      try {
        await saveConsent(sessionId, data);
      } catch (error) {
        console.error('Failed to save consent data to Supabase:', error);
        // Continue anyway - consent is stored in sessionStorage
      }
    }
  };

  if (!hasConsent) {
    return <ConsentForm onConsent={handleConsent} />;
  }

  return <TestContainer consentData={consentData} sessionId={sessionId} />;
}