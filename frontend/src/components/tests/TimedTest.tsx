// components/tests/TimedTest.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';

interface TimedTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

interface FormData {
  // Personal Details
  fullName: string;
  email: string;
  age: string;
  occupation: string;
  
  // Longer Answer Questions
  morningRoutine: string;
  favoriteMemory: string;
  weekendActivity: string;
}

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold text-gray-700 mb-3">
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ShortInputField = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  disabled
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      disabled={disabled}
      className={`w-full p-2 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${
        disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
      }`}
    />
  </div>
);

const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  disabled
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      disabled={disabled}
      rows={3}
      className={`w-full p-2 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none ${
        disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
      }`}
    />
  </div>
);

export function TimedTest({ onShowData, onClearData, showData }: TimedTestProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    age: '',
    occupation: '',
    morningRoutine: '',
    favoriteMemory: '',
    weekendActivity: '',
  });

  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { 
    logKeyDown, 
    logKeyUp, 
    clearLogs, 
    getLogs, 
    getAnalytics,
    exportAsJSON,
    exportAsCSV 
  } = useKeystrokeLogger();
  
  const timerRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (timerExpired) return;
    
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Start timer on first keystroke
    if (!hasStarted) {
      setHasStarted(true);
      setIsTimerActive(true);
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      email: '',
      age: '',
      occupation: '',
      morningRoutine: '',
      favoriteMemory: '',
      weekendActivity: '',
    });
    setIsTimerActive(false);
    setTimerExpired(false);
    setHasStarted(false);
    setTimeLeft(120);
    clearLogs();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onClearData();
  };

  // Calculate completion percentage
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div>
      {/* Timer Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        timerExpired ? 'bg-red-50 border-red-300' : 
        isTimerActive ? 'bg-orange-50 border-orange-300' : 
        'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              {timerExpired ? '⏰ Time\'s Up!' : 
               isTimerActive ? '⏱️ Timer Running' : 
               '⏱️ Timer Ready'}
            </h3>
            <p className="text-sm text-gray-600">
              {timerExpired ? 'You ran out of time!' : 
               isTimerActive ? 'Fill out as much as you can!' : 
               'Start typing to begin the 120-second challenge'}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${
              timerExpired ? 'text-red-600' : 
              timeLeft <= 10 ? 'text-red-600' : 
              timeLeft <= 30 ? 'text-orange-600' : 
              'text-blue-600'
            }`}>
              {timeLeft}s
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {completionPercentage}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
        <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
        <p className="text-sm text-gray-700">
          You have <strong>120 seconds</strong> to fill out as many fields as possible. 
          The timer starts as soon as you begin typing. Answer quickly but naturally!
        </p>
      </div>

      {/* Form */}
      <div className="max-h-[500px] overflow-y-auto pr-2 mb-6">
        <FormSection title="Personal Details">
          <ShortInputField
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
          <ShortInputField
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange('email')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
          <ShortInputField
            label="Age"
            value={formData.age}
            onChange={handleInputChange('age')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
          <ShortInputField
            label="Occupation"
            value={formData.occupation}
            onChange={handleInputChange('occupation')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
        </FormSection>

        <FormSection title="Tell Us About Yourself">
          <LongTextArea
            label="Describe your typical morning routine"
            value={formData.morningRoutine}
            onChange={handleInputChange('morningRoutine')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
          <LongTextArea
            label="What's your favorite memory from the past year?"
            value={formData.favoriteMemory}
            onChange={handleInputChange('favoriteMemory')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
          <LongTextArea
            label="How do you typically spend your weekends?"
            value={formData.weekendActivity}
            onChange={handleInputChange('weekendActivity')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={timerExpired}
          />
        </FormSection>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onShowData}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {showData ? 'Hide Data' : 'Show All Data'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Clear Data
        </button>
      </div>

      {/* Keystroke Data Display */}
      {showData && (
        <KeystrokeDataDisplay 
          events={getLogs()}
          analytics={getAnalytics()}
          onExportJSON={exportAsJSON}
          onExportCSV={exportAsCSV}
        />
      )}
    </div>
  );
}