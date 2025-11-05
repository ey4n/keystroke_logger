import React, { useState, useRef, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';
import { FormData, initialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';

interface TimedTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

export function TimedTest({ onShowData, onClearData, showData }: TimedTestProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
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
    setFormData(initialFormData);
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
      <DataCollectionForm
        formData={formData}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        disabled={timerExpired}
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />

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