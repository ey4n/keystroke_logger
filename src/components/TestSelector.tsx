import React from 'react';
import { TestType, TestConfig } from '../types/keystroke';

interface TestSelectorProps {
  currentTest: TestType;
  onTestChange: (test: TestType) => void;
}

const AVAILABLE_TESTS: TestConfig[] = [
  {
    id: 'free',
    name: 'Free Typing',
    description: 'Type freely without constraints',
    enabled: true,
  },
  {
    id: 'timed',
    name: 'Timed Test',
    description: 'Complete typing within a time limit',
    enabled: true,
  },
  {
    id: 'multitasking',
    name: 'Multitasking Test',
    description: 'Type while performing other tasks',
    enabled: false,
  },
  {
    id: 'errorProne',
    name: 'Error-Prone Test',
    description: 'Test with intentional distractions',
    enabled: false,
  },
  {
    id: 'lying',
    name: 'Lying Test',
    description: 'Lie on some form fields',
    enabled: true,
  },
];

export function TestSelector({ currentTest, onTestChange }: TestSelectorProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Select Test Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AVAILABLE_TESTS.map((test) => (
          <button
            key={test.id}
            onClick={() => test.enabled && onTestChange(test.id)}
            disabled={!test.enabled}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              currentTest === test.id
                ? 'border-indigo-500 bg-indigo-50'
                : test.enabled
                ? 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{test.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
              </div>
              {currentTest === test.id && (
                <span className="ml-2 text-indigo-600">✓</span>
              )}
              {!test.enabled && (
                <span className="ml-2 text-xs text-gray-400 font-medium">Coming Soon</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}