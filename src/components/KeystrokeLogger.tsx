import React, { useState } from 'react';
import { TestType } from '../types/keystroke';
import { TestSelector } from './TestSelector';
import { TimedTest } from './tests/TimedTest';
import { Free } from './tests/Free';
import { LyingTest } from './tests/LyingTest';
import { MultitaskingTest } from './tests/MultitaskingTest';

export default function KeystrokeLogger() {
  const [currentTest, setCurrentTest] = useState<TestType>('free');
  const [showData, setShowData] = useState(false);

  const handleTestChange = (test: TestType) => {
    setCurrentTest(test);
    setShowData(false);
  };

  const toggleShowData = () => {
    setShowData(!showData);
  };

  const handleClearData = () => {
    setShowData(false);
  };

  const renderTest = () => {
    const commonProps = {
      onShowData: toggleShowData,
      onClearData: handleClearData,
      showData,
    };

    switch (currentTest) {
      case 'free':
        return <Free {...commonProps} />;
      case 'timed':
        return <TimedTest {...commonProps} />;
      case 'multitasking':
        return <MultitaskingTest {...commonProps} />;
      case 'lying':
        return <LyingTest {...commonProps} />;
      default:
        return <Free {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Keystroke Dynamics Logger
          </h1>
          <p className="text-gray-600 mb-6">
            Choose a test type and capture keystroke dynamics data.
          </p>

          {/* THIS IS WHERE THE TEST SELECTOR APPEARS */}
          <TestSelector currentTest={currentTest} onTestChange={handleTestChange} />

          {/* THIS RENDERS THE SELECTED TEST */}
          {renderTest()}
        </div>
      </div>
    </div>
  );
}