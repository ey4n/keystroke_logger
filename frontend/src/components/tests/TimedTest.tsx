'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, initialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';

interface TimedTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    exportAsJSON: () => void;
    exportAsCSV: () => void;
    formData: any;
  }) => void;
}

export function TimedTest({ sessionId, onTestDataUpdate }: TimedTestProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  
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

  // Calculate elapsed time
  const elapsedTime = startTime ? 120 - timeLeft : 0;

  // Calculate completion percentage
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Update parent with current data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
      exportAsJSON,
      exportAsCSV,
      formData: {
        timeLimit: 120,
        timeElapsed: elapsedTime,
        timeRemaining: timeLeft,
        timerExpired,
        completionPercentage,
        filledFields,
        totalFields,
        formSnapshot: formData,
      }
    });
  }, [formData, timeLeft, timerExpired, elapsedTime, completionPercentage]);

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
      setStartTime(Date.now());
    }
  };

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
    </div>
  );
}