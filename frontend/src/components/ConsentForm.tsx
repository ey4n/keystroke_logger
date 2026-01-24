'use client';

import React, { useState } from 'react';

interface ConsentData {
  consentGiven: boolean;
  deviceType: string;
  primaryLanguage: string;
  languageOther?: string;
  browser: string;
}

interface ConsentFormProps {
  onConsent: (data: ConsentData) => void;
}

export function ConsentForm({ onConsent }: ConsentFormProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [languageOther, setLanguageOther] = useState('');
  const [browser, setBrowser] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect browser
  React.useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let detectedBrowser = '';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      detectedBrowser = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      detectedBrowser = 'Safari';
    } else if (userAgent.includes('Edg')) {
      detectedBrowser = 'Edge';
    } else if (userAgent.includes('Firefox')) {
      detectedBrowser = 'Firefox';
    }
    
    if (detectedBrowser) {
      setBrowser(detectedBrowser);
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!consentGiven) {
      newErrors.consent = 'You must agree to participate to continue.';
    }

    if (!deviceType) {
      newErrors.deviceType = 'Please select your device type.';
    }

    if (!primaryLanguage) {
      newErrors.primaryLanguage = 'Please select your primary typing language.';
    }

    if (primaryLanguage === 'Other' && !languageOther.trim()) {
      newErrors.languageOther = 'Please specify your typing language.';
    }

    if (!browser) {
      newErrors.browser = 'Please select your browser.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const consentData: ConsentData = {
      consentGiven,
      deviceType,
      primaryLanguage,
      browser,
      ...(primaryLanguage === 'Other' && { languageOther: languageOther.trim() }),
    };

    // Store in sessionStorage (cleared when browser tab closes)
    sessionStorage.setItem('keystroke_consent', JSON.stringify(consentData));
    
    onConsent(consentData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Research Consent Form
          </h1>
          <p className="text-gray-600">
            Please review and complete the following information before participating in the study.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consent Checkbox */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  I agree to participate in this research willingly and consent to my keystroke data being collected for research purposes.
                </span>
                {errors.consent && (
                  <p className="text-red-600 text-sm mt-1">{errors.consent}</p>
                )}
              </div>
            </label>
          </div>

          {/* Device Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device used <span className="text-red-500">*</span>
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                errors.deviceType
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            >
              <option value="">Select device type...</option>
              <option value="Laptop (built-in keyboard)">Laptop (built-in keyboard)</option>
              <option value="Laptop (external keyboard)">Laptop (external keyboard)</option>
              <option value="Desktop keyboard">Desktop keyboard</option>
              <option value="Mobile (iOS)">Mobile (iOS)</option>
              <option value="Mobile (Android)">Mobile (Android)</option>
              <option value="Mobile (Others)">Mobile (Others)</option>
            </select>
            {errors.deviceType && (
              <p className="text-red-600 text-sm mt-1">{errors.deviceType}</p>
            )}
          </div>

          {/* Primary Typing Language Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary typing language <span className="text-red-500">*</span>
            </label>
            <select
              value={primaryLanguage}
              onChange={(e) => {
                setPrimaryLanguage(e.target.value);
                if (e.target.value !== 'Other') {
                  setLanguageOther('');
                }
              }}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                errors.primaryLanguage
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            >
              <option value="">Select language...</option>
              <option value="English">English</option>
              <option value="Other">Other (specify)</option>
            </select>
            {errors.primaryLanguage && (
              <p className="text-red-600 text-sm mt-1">{errors.primaryLanguage}</p>
            )}

            {/* Other Language Input */}
            {primaryLanguage === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={languageOther}
                  onChange={(e) => setLanguageOther(e.target.value)}
                  placeholder="Specify your typing language"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.languageOther
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
                {errors.languageOther && (
                  <p className="text-red-600 text-sm mt-1">{errors.languageOther}</p>
                )}
              </div>
            )}
          </div>

          {/* Browser Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Browser <span className="text-red-500">*</span>
            </label>
            <select
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                errors.browser
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            >
              <option value="">Select browser...</option>
              <option value="Chrome">Chrome</option>
              <option value="Safari">Safari</option>
              <option value="Edge">Edge</option>
              <option value="Firefox">Firefox</option>
            </select>
            {errors.browser && (
              <p className="text-red-600 text-sm mt-1">{errors.browser}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg shadow-md"
            >
              I Consent - Begin Tests
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
