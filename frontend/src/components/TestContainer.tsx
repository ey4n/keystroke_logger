'use client';

import React, { useState, useEffect } from 'react';
import { TestSelector } from './TestSelector';
import { Free } from '../components/tests/Free';
import { TimedTest } from '../components/tests/TimedTest';
import { MultitaskingTest } from '../components/tests/MultitaskingTest';
import { LyingTest } from '../components/tests/LyingTest'; 
import { KeystrokeDataDisplay } from '../components/KeystrokeDataDisplay';
import { TestType } from '../types/keystroke';

export default function TestContainer() {
  const [currentTest, setCurrentTest] = useState<TestType>('free');
  const [showData, setShowData] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Store refs to each test's data functions
  const [testDataRef, setTestDataRef] = useState<{
    getLogs: () => any[];
    getAnalytics: () => any;
    exportAsJSON: () => void;
    exportAsCSV: () => void;
    formData?: any;
  } | null>(null);

  // Generate session ID once when container mounts
  useEffect(() => {
    const id = globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`;
    setSessionId(id);
    console.log('Session started:', id);
  }, []);

  // Generate new session when requested
  const regenerateSession = () => {
    const id = globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`;
    setSessionId(id);
    setShowData(false);
    console.log('New session started:', id);
  };

  const handleShowData = () => setShowData(prev => !prev);
  const handleClearData = () => setShowData(false);

  // Change test handler
  const handleTestChange = (test: TestType) => {
    setCurrentTest(test);
    setShowData(false); // Hide data when switching tests
  };

  // Callback to receive test data from child components
  const handleTestDataUpdate = (dataFunctions: any) => {
    setTestDataRef(dataFunctions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Keystroke Dynamics Logger
          </h1>
        </div>

        {/* Session Info Card */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Current Session ID for testing: </span>
              <span className="font-mono text-sm font-semibold text-indigo-600">
                {sessionId || 'Loading...'}
              </span>
            </div>
            <button
              onClick={regenerateSession}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <span>🔄</span>
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Test Selector */}
        <TestSelector 
          currentTest={currentTest} 
          onTestChange={handleTestChange}
        />

        {/* Test Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
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
        </div>

        {/* Centralized Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleShowData}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {showData ? 'Hide Data' : 'Show All Data'}
          </button>
          
          <button
            onClick={() => {
              handleClearData();
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Clear Data
          </button>
        </div>

        {/* Data Display */}
        {showData && testDataRef && (
          <KeystrokeDataDisplay
            events={testDataRef.getLogs()}
            analytics={testDataRef.getAnalytics()}
            onExportJSON={testDataRef.exportAsJSON}
            onExportCSV={testDataRef.exportAsCSV}
            testType={currentTest}
            sessionId={sessionId}
            formData={testDataRef.formData}
          />
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All data is captured with your session ID: <code className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionId}</code></p>
        </div>
      </div>
    </div>
  );
}