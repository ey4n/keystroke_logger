'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TestSelector } from './TestSelector';
import { Free } from '../components/tests/Free';
import { TimedTest } from '../components/tests/TimedTest';
import { MultitaskingTest } from '../components/tests/MultitaskingTest';
import { KeystrokeDataDisplay } from '../components/KeystrokeDataDisplay';
import { ColourTest } from '../components/tests/Colour';
import { TestType } from '../types/keystroke';

interface ConsentData {
  consentGiven: boolean;
  deviceType: string;
  primaryLanguage: string;
  languageOther?: string;
  browser: string;
}

interface TestContainerProps {
  consentData?: ConsentData | null;
  sessionId?: string;
}

export default function TestContainer({ consentData, sessionId: propSessionId }: TestContainerProps = {}) {
  const [currentTest, setCurrentTest] = useState<TestType>('free');
  const [showData, setShowData] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [dataVersion, setDataVersion] = useState(0);
  
  // Store refs to each test's data functions
  const [testDataRef, setTestDataRef] = useState<{
    getLogs: () => any[];
    getAnalytics: () => any;
    exportAsJSON: () => void;
    exportAsCSV: () => void;
    clearLogs: () => void;
    formData?: any;
  } | null>(null);

  // Use provided sessionId or generate one
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
      sessionStorage.setItem('session_id', propSessionId);
    } else {
      const stored = sessionStorage.getItem('session_id');
      if (stored) {
        setSessionId(stored);
      } else {
        const id = globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`;
        setSessionId(id);
        sessionStorage.setItem('session_id', id);
      }
    }
    console.log('Session started:', sessionId || propSessionId);
  }, [propSessionId]);

  // Generate new session when requested - clears consent and reloads page
  const regenerateSession = () => {
    // Clear consent from sessionStorage
    sessionStorage.removeItem('keystroke_consent');
    // Reload page to show consent form again
    window.location.reload();
  };

  const handleShowData = () => setShowData(prev => !prev);

  // replace your clear handler with:
  const handleClearData = () => {
    if (testDataRef && typeof testDataRef.clearLogs === 'function') {
      testDataRef.clearLogs();
    }
    setShowData(true);              // keep panel visible
    setDataVersion(v => v + 1);     // force remount of the table
  };



  // Change test handler
  const handleTestChange = (test: TestType) => {
    setCurrentTest(test);
    setShowData(false); // Hide data when switching tests
  };

  // Callback to receive test data from child components
  const handleTestDataUpdate = useCallback((dataFunctions: any) => {
  setTestDataRef(prev => (prev === dataFunctions ? prev : dataFunctions));
}, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Keystroke Dynamics Logger
              </h1>
              <p className="text-sm text-gray-600">Research data collection platform</p>
            </div>
            <button
              onClick={regenerateSession}
              className="px-4 py-2 text-sm bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>New Session</span>
            </button>
          </div>

          {/* Session Info Card - Improved */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-indigo-100 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Session ID</span>
                </div>
                <span className="font-mono text-sm sm:text-base font-semibold text-indigo-700 break-all">
                  {sessionId || 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Selector */}
        <TestSelector 
          currentTest={currentTest} 
          onTestChange={handleTestChange}
        />

        {/* Test Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200/50 mb-6">
          {currentTest === 'free' && (
            <Free
              sessionId={sessionId}
              onTestDataUpdate={handleTestDataUpdate}
            />
          )}
          
          {currentTest === 'timed' && (
            <TimedTest
              sessionId={sessionId}
              onTestDataUpdate={handleTestDataUpdate}
            />
          )}
          
          {currentTest === 'multitasking' && (
            <MultitaskingTest
              sessionId={sessionId}
              onTestDataUpdate={handleTestDataUpdate}
            />
          )}

          {currentTest === 'colour' && (
            <ColourTest
              sessionId={sessionId}
              onTestDataUpdate={handleTestDataUpdate}
            />
          )}
        </div>

        {/* Centralized Action Buttons - Improved */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleShowData}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showData ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
            </svg>
            <span>{showData ? 'Hide Data' : 'Show All Data'}</span>
          </button>
        </div>

        {/* Data Display */}
        {showData && testDataRef && (
          <KeystrokeDataDisplay
            key={`${currentTest}-${sessionId}-${dataVersion}`}
            events={testDataRef.getLogs()}
            analytics={testDataRef.getAnalytics()}
            onExportJSON={testDataRef.exportAsJSON}
            onExportCSV={testDataRef.exportAsCSV}
            testType={currentTest}
            sessionId={sessionId}
            formData={testDataRef.formData}
          />
        )}

        {/* Footer Info - Improved */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>All data is securely captured with your session ID</span>
            </div>
            {consentData && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded">Device: {consentData.deviceType}</span>
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">Browser: {consentData.browser}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}