'use client';

import React, { useState } from 'react';
import { ResearchSetupConsent, type SetupConsentStepData } from './ResearchSetupConsent';
import { WellnessBaselineForm } from './WellnessBaselineForm';

export interface ConsentData {
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

interface ConsentFormProps {
  onConsent: (data: ConsentData) => void;
}

export function ConsentForm({ onConsent }: ConsentFormProps) {
  const [step, setStep] = useState<'setup' | 'baseline'>('setup');
  const [step1Data, setStep1Data] = useState<SetupConsentStepData | null>(null);

  if (step === 'setup') {
    return (
      <ResearchSetupConsent
        onContinue={(data) => {
          setStep1Data(data);
          setStep('baseline');
        }}
      />
    );
  }

  if (step === 'baseline' && step1Data) {
    return (
      <WellnessBaselineForm
        step1Data={step1Data}
        onConsent={onConsent}
      />
    );
  }

  return null;
}
