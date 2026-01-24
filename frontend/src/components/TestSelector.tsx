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
    enabled: true,
  },
  {
    id: 'noise',
    name: 'Environmental Stimulations Test',
    description: 'Complete form fields with environmental stimulation in the background',
    enabled: false,
  },
];

export function TestSelector({ currentTest, onTestChange }: TestSelectorProps) {
  const getTestIcon = (testId: string) => {
    switch (testId) {
      case 'free':
        return '✍️';
      case 'timed':
        return '⏱️';
      case 'multitasking':
        return '🧠';
      case 'noise':
        return '🔊';
      default:
        return '📝';
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Select Test Type</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_TESTS.map((test) => (
          <button
            key={test.id}
            onClick={() => test.enabled && onTestChange(test.id)}
            disabled={!test.enabled}
            className={`group relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
              currentTest === test.id
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md scale-105'
                : test.enabled
                ? 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md hover:scale-102'
                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getTestIcon(test.id)}</span>
                  <h3 className={`font-semibold ${
                    currentTest === test.id ? 'text-indigo-700' : 'text-gray-800'
                  }`}>
                    {test.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{test.description}</p>
              </div>
              {currentTest === test.id && (
                <div className="ml-3 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              {!test.enabled && (
                <span className="ml-2 text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
              )}
            </div>
            {currentTest === test.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-xl"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}