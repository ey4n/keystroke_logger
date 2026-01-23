'use client';

import React, { useState, useEffect } from 'react';
import TestContainer from '../components/TestContainer';
import { ConsentForm } from '../components/ConsentForm';

interface ConsentData {
  consentGiven: boolean;
  deviceType: string;
  primaryLanguage: string;
  languageOther?: string;
  browser: string;
}

export default function Page() {
  const [hasConsent, setHasConsent] = useState(false);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);

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

  const handleConsent = (data: ConsentData) => {
    setConsentData(data);
    setHasConsent(true);
    // Store in sessionStorage (cleared when browser tab closes)
    sessionStorage.setItem('keystroke_consent', JSON.stringify(data));
  };

  if (!hasConsent) {
    return <ConsentForm onConsent={handleConsent} />;
  }

  return <TestContainer consentData={consentData} />;
}