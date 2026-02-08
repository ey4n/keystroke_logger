'use client';

import React, { useState, useEffect } from 'react';

export interface SetupConsentStepData {
  consentGiven: boolean;
  deviceType: string;
  primaryLanguage: string;
  languageOther?: string;
  browser: string;
}

interface ResearchSetupConsentProps {
  onContinue: (data: SetupConsentStepData) => void;
}

export function ResearchSetupConsent({ onContinue }: ResearchSetupConsentProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English (UK)');
  const [languageOther, setLanguageOther] = useState('');
  const [browser, setBrowser] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;

    // Auto-detect browser
    if (ua.includes('Edg')) setBrowser('Edge');
    else if (ua.includes('Chrome')) setBrowser('Chrome');
    else if (ua.includes('Safari') && !ua.includes('Chrome')) setBrowser('Safari');
    else if (ua.includes('Firefox')) setBrowser('Firefox');

    // Auto-detect primary device (only set if we can infer mobile/phone; leave desktop/laptop for user to choose)
    if (ua.includes('iPhone')) setDeviceType('iPhone');
    else if (ua.includes('Android')) setDeviceType('Mobile (Android)');
    else if (ua.includes('iPad') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) setDeviceType('Mobile (Others)');
    else if (/Mobile|webOS|BlackBerry|Opera Mini|Opera Mobi/i.test(ua)) setDeviceType('Mobile (Others)');
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!consentGiven) newErrors.consent = 'You must agree to participate to continue.';
    if (!deviceType) newErrors.deviceType = 'Please select your primary device.';
    if (!browser) newErrors.browser = 'Please select your browser.';
    if (primaryLanguage === 'Other' && !languageOther.trim()) {
      newErrors.languageOther = 'Please specify your typing language.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onContinue({
      consentGiven,
      deviceType,
      primaryLanguage: primaryLanguage === 'Other' ? languageOther.trim() : primaryLanguage,
      ...(primaryLanguage === 'Other' && { languageOther: languageOther.trim() }),
      browser,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Subtle dotted background */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #9ca3af 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="pt-8 pb-2 px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-3 [&_svg]:block [&_svg]:m-auto">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Research Setup</h1>
          <p className="text-gray-500 text-sm mt-1">Keystroke Dynamics Study</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
          {/* Project info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 shrink-0 [&_svg]:block [&_svg]:m-auto">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project info</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              This academic study aims to analyse behavioral patterns through keystroke dynamics. Your session will last approximately 5 minutes.
            </p>
          </div>

          {/* Your setup */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 shrink-0 [&_svg]:block [&_svg]:m-auto">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your setup</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Input language</label>
              <select
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                className="w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Other">Other (specify)</option>
              </select>
              {primaryLanguage === 'Other' && (
                <input
                  type="text"
                  value={languageOther}
                  onChange={(e) => setLanguageOther(e.target.value)}
                  placeholder="Specify your typing language"
                  className={`mt-2 w-full min-h-[44px] px-3 py-2 border rounded-xl text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${errors.languageOther ? 'border-red-500' : 'border-gray-300'}`}
                />
              )}
              {errors.languageOther && <p className="text-red-600 text-sm mt-1">{errors.languageOther}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Primary device</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className={`w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white appearance-none cursor-pointer ${errors.deviceType ? 'border-red-500' : 'border-gray-300'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
              >
                <option value="">Select device...</option>
                <option value="iPhone">iPhone</option>
                <option value="Mobile (Android)">Mobile (Android)</option>
                <option value="Mobile (Others)">Mobile (Others)</option>
                <option value="Laptop (built-in keyboard)">Laptop (built-in keyboard)</option>
                <option value="Laptop (external keyboard)">Laptop (external keyboard)</option>
                <option value="Desktop keyboard">Desktop keyboard</option>
              </select>
              {errors.deviceType && <p className="text-red-600 text-sm mt-1">{errors.deviceType}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Browser</label>
              <select
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                className={`w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white appearance-none cursor-pointer ${errors.browser ? 'border-red-500' : 'border-gray-300'}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
              >
                <option value="">Select browser...</option>
                <option value="Chrome">Chrome</option>
                <option value="Safari">Safari</option>
                <option value="Edge">Edge</option>
                <option value="Firefox">Firefox</option>
              </select>
              {errors.browser && <p className="text-red-600 text-sm mt-1">{errors.browser}</p>}
            </div>
          </div>

          {/* Consent */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 shrink-0 [&_svg]:block [&_svg]:m-auto">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Consent</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Participation Agreement</p>
                <p className="text-sm text-gray-500 mt-0.5">I agree to data collection</p>
                {errors.consent && <p className="text-red-600 text-sm mt-1">{errors.consent}</p>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={consentGiven}
                onClick={() => setConsentGiven((c) => !c)}
                className={`flex-shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center ${consentGiven ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <span
                  className="block w-5 h-5 rounded-full bg-white shadow shrink-0 transition-transform duration-200"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            Begin Study Session
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          <p className="text-center text-xs text-gray-400">
            Data is securely encrypted and processed for research purposes only.
          </p>
        </form>
      </div>
    </div>
  );
}
