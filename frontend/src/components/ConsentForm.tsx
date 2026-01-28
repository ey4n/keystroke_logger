'use client';

import React, { useState } from 'react';

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

interface ConsentFormProps {
  onConsent: (data: ConsentData) => void;
}

export function ConsentForm({ onConsent }: ConsentFormProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [languageOther, setLanguageOther] = useState('');
  const [browser, setBrowser] = useState('');
  const [location, setLocation] = useState('');
  const [noiseLevel, setNoiseLevel] = useState('');
  const [sittingOrStanding, setSittingOrStanding] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [sleepLastNight, setSleepLastNight] = useState('');
  const [caffeineLast6Hours, setCaffeineLast6Hours] = useState('');
  const [currentMoodBaseline, setCurrentMoodBaseline] = useState<number | null>(null);
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

    if (!location) {
      newErrors.location = 'Please select your location.';
    }

    if (!noiseLevel) {
      newErrors.noiseLevel = 'Please select the noise level.';
    }

    if (!sittingOrStanding) {
      newErrors.sittingOrStanding = 'Please select whether you are sitting or standing.';
    }

    if (!timeOfDay) {
      newErrors.timeOfDay = 'Please select the time of day.';
    }

    if (!sleepLastNight.trim()) {
      newErrors.sleepLastNight = 'Please enter hours of sleep last night.';
    }

    if (!caffeineLast6Hours) {
      newErrors.caffeineLast6Hours = 'Please select caffeine consumption.';
    }

    if (currentMoodBaseline === null) {
      newErrors.currentMoodBaseline = 'Please rate your current mood baseline.';
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
      location,
      noiseLevel,
      sittingOrStanding,
      timeOfDay,
      sleepLastNight: sleepLastNight.trim(),
      caffeineLast6Hours,
      currentMoodBaseline,
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

          {/* Environmental Data Section */}
          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Environmental & Baseline Information
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Please provide information about your current environment and baseline state.
            </p>

            <div className="space-y-6">
              {/* Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.location
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                >
                  <option value="">Select location...</option>
                  <option value="quiet room">Quiet room</option>
                  <option value="public place">Public place</option>
                  <option value="office">Office</option>
                  <option value="outdoors">Outdoors</option>
                </select>
                {errors.location && (
                  <p className="text-red-600 text-sm mt-1">{errors.location}</p>
                )}
              </div>

              {/* Noise Level Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Noise level <span className="text-red-500">*</span>
                </label>
                <select
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.noiseLevel
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                >
                  <option value="">Select noise level...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.noiseLevel && (
                  <p className="text-red-600 text-sm mt-1">{errors.noiseLevel}</p>
                )}
              </div>

              {/* Sitting or Standing Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sitting or standing <span className="text-red-500">*</span>
                </label>
                <select
                  value={sittingOrStanding}
                  onChange={(e) => setSittingOrStanding(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.sittingOrStanding
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                >
                  <option value="">Select position...</option>
                  <option value="sitting">Sitting</option>
                  <option value="standing">Standing</option>
                </select>
                {errors.sittingOrStanding && (
                  <p className="text-red-600 text-sm mt-1">{errors.sittingOrStanding}</p>
                )}
              </div>

              {/* Time of Day Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of day <span className="text-red-500">*</span>
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.timeOfDay
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                >
                  <option value="">Select time of day...</option>
                  <option value="morning">Morning (6am-12pm)</option>
                  <option value="afternoon">Afternoon (12pm-5pm)</option>
                  <option value="evening">Evening (5pm-9pm)</option>
                  <option value="night">Night (9pm-6am)</option>
                </select>
                {errors.timeOfDay && (
                  <p className="text-red-600 text-sm mt-1">{errors.timeOfDay}</p>
                )}
              </div>

              {/* Sleep Last Night Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep last night (hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={sleepLastNight}
                  onChange={(e) => setSleepLastNight(e.target.value)}
                  placeholder="e.g., 7.5"
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.sleepLastNight
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                />
                {errors.sleepLastNight && (
                  <p className="text-red-600 text-sm mt-1">{errors.sleepLastNight}</p>
                )}
              </div>

              {/* Caffeine Last 6 Hours Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caffeine in last 6 hours <span className="text-red-500">*</span>
                </label>
                <select
                  value={caffeineLast6Hours}
                  onChange={(e) => setCaffeineLast6Hours(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    errors.caffeineLast6Hours
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                >
                  <option value="">Select amount...</option>
                  <option value="none">None</option>
                  <option value="1">1</option>
                  <option value="2+">2+</option>
                </select>
                {errors.caffeineLast6Hours && (
                  <p className="text-red-600 text-sm mt-1">{errors.caffeineLast6Hours}</p>
                )}
              </div>

              {/* Current Mood Baseline (Stress 0-10) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Current mood baseline (stress 0–10) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setCurrentMoodBaseline(rating)}
                      className={`
                        flex-1 py-3 px-2 rounded-lg font-semibold text-sm
                        transition-all duration-200 transform hover:scale-105 active:scale-95
                        ${currentMoodBaseline === rating
                          ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                        }
                      `}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-1 mt-2">
                  <span>1 (Not at all stressed)</span>
                  <span>10 (Extremely stressed)</span>
                </div>
                {currentMoodBaseline !== null && (
                  <div className="text-center mt-2">
                    <span className="text-sm font-semibold text-indigo-600">Selected: {currentMoodBaseline}</span>
                  </div>
                )}
                {errors.currentMoodBaseline && (
                  <p className="text-red-600 text-sm mt-1">{errors.currentMoodBaseline}</p>
                )}
              </div>
            </div>
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
