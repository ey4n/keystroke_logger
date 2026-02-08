'use client';

import React, { useState, useEffect } from 'react';
import type { SetupConsentStepData } from './ResearchSetupConsent';
import type { ConsentData } from './ConsentForm';

interface WellnessBaselineFormProps {
  step1Data: SetupConsentStepData;
  onConsent: (data: ConsentData) => void;
}

const TYPING_ENVIRONMENTS = [
  { id: 'Home', label: 'Home', noiseLevel: 'low' as const },
  { id: 'Office', label: 'Office', noiseLevel: 'medium' as const },
  { id: 'Public', label: 'Public', noiseLevel: 'high' as const },
] as const;
const POSTURE_OPTIONS = ['Sitting', 'Standing'] as const;
const CAFFEINE_OPTIONS = ['None', '1', '2+'] as const;
const TIME_OF_DAY_OPTIONS = [
  { value: 'morning', label: 'Morning (6am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–5pm)' },
  { value: 'evening', label: 'Evening (5pm–9pm)' },
  { value: 'night', label: 'Night (9pm–6am)' },
];

function getDefaultTimeOfDay(): string {
  if (typeof window === 'undefined') return 'afternoon';
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function WellnessBaselineForm({ step1Data, onConsent }: WellnessBaselineFormProps) {
  const [typingEnvironment, setTypingEnvironment] = useState<string>('Home');
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [posture, setPosture] = useState<string>('Sitting');
  const [caffeineLast12h, setCaffeineLast12h] = useState('');
  const [timeOfDay, setTimeOfDay] = useState(getDefaultTimeOfDay);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTimeOfDay(getDefaultTimeOfDay());
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (stressLevel === null) newErrors.stressLevel = 'Please select your current stress level.';
    const sleep = sleepHours.trim();
    if (!sleep) newErrors.sleepHours = 'Please enter hours of sleep.';
    else {
      const n = parseFloat(sleep);
      if (Number.isNaN(n) || n < 0 || n > 24) newErrors.sleepHours = 'Enter a number between 0 and 24.';
    }
    if (!caffeineLast12h) newErrors.caffeine = 'Please select caffeine in the last 12 hours.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const browser = step1Data.browser || (typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg') ? 'Chrome' : navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari' : navigator.userAgent.includes('Edg') ? 'Edge' : navigator.userAgent.includes('Firefox') ? 'Firefox' : '') : '') || 'Unknown';
    const envEntry = TYPING_ENVIRONMENTS.find((e) => e.id === typingEnvironment);

    const fullData: ConsentData = {
      consentGiven: step1Data.consentGiven,
      deviceType: step1Data.deviceType,
      primaryLanguage: step1Data.primaryLanguage,
      ...(step1Data.languageOther && { languageOther: step1Data.languageOther }),
      browser: browser || 'Unknown',
      location: '',
      noiseLevel: envEntry?.noiseLevel ?? 'medium',
      sittingOrStanding: posture.toLowerCase(),
      timeOfDay,
      sleepLastNight: sleepHours.trim(),
      caffeineLast6Hours: caffeineLast12h,
      currentMoodBaseline: stressLevel,
    };

    onConsent(fullData);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="pt-8 pb-2 px-6">
          <h1 className="text-2xl font-bold text-gray-900">Baseline</h1>
          <p className="text-gray-500 text-sm mt-1">A few quick questions before we begin</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
          {/* Typing environment - Home / Office / Public */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Typing environment</label>
            </div>
            <div className="flex gap-3 flex-wrap">
              {TYPING_ENVIRONMENTS.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setTypingEnvironment(env.id)}
                  className={`flex-1 min-w-[90px] flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors ${
                    typingEnvironment === env.id
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {env.id === 'Home' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {env.id === 'Office' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {env.id === 'Public' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                  <span className="font-medium text-sm">{env.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current stress level - blocks 1-10 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current mood baseline (stress 0–10) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStressLevel(n)}
                  className={`aspect-square min-h-[44px] w-full rounded-lg font-semibold text-base transition-all duration-200 ${
                    stressLevel === n
                      ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300 ring-offset-2'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1 mt-2">
              <span>1 (Not at all stressed)</span>
              <span>10 (Extremely stressed)</span>
            </div>
            {errors.stressLevel && <p className="text-red-600 text-sm mt-1">{errors.stressLevel}</p>}
          </div>

          {/* Sleep hours */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sleep in the last 24 hours</label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              inputMode="decimal"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 7"
              className={`w-full min-h-[48px] px-4 py-2.5 text-base border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.sleepHours ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.sleepHours && <p className="text-red-600 text-sm mt-1">{errors.sleepHours}</p>}
          </div>

          {/* Posture */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Posture</label>
            <select
              value={posture}
              onChange={(e) => setPosture(e.target.value)}
              className="w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            >
              {POSTURE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Caffeine in the last 12 hours */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Caffeine in the last 12 hours</label>
            <select
              value={caffeineLast12h}
              onChange={(e) => setCaffeineLast12h(e.target.value)}
              className={`w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer ${errors.caffeine ? 'border-red-500' : 'border-gray-300'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">Select amount...</option>
              {CAFFEINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
            {errors.caffeine && <p className="text-red-600 text-sm mt-1">{errors.caffeine}</p>}
          </div>

          {/* Time of day */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Time of day</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            >
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            I Consent – Begin Tests
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            End-to-end encrypted research data.
          </p>
        </form>
      </div>
    </div>
  );
}
