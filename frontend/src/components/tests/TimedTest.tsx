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
    formData: any;
  }) => void;
}

export function TimedTest({ sessionId, onTestDataUpdate }: TimedTestProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [timeLeft, setTimeLeft] = useState(200);
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
    setFieldName
  } = useKeystrokeLogger();
  
  const timerRef = useRef<number | null>(null);

  // Calculate elapsed time
  const elapsedTime = startTime ? 200 - timeLeft : 0;

  // Calculate completion percentage
  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Calculate points: max points for completing all, -5 for each incomplete question
  const maxPoints = totalFields * 5; // 5 points per question
  const incompleteFields = totalFields - filledFields;
  const score = Math.max(0, maxPoints - (incompleteFields * 5));

  const handleFieldFocus = (fieldName: keyof FormData) => {
      console.log('question:', fieldName);
      setFieldName(fieldName);  // ← Finally calls setFieldName!
    };

  // Update parent with current data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
        formData: {
          timeLimit: 200,
          timeElapsed: elapsedTime,
          timeRemaining: timeLeft,
          timerExpired,
          completionPercentage,
          filledFields,
          totalFields,
          score,
          maxPoints,
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
      {/* Points Bar */}
      <div className="mb-6 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg border-4 border-indigo-300 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium mb-1">Your Score</div>
            <div className="text-white text-5xl font-bold">{score}</div>
            <div className="text-indigo-100 text-xs mt-1">
              Max: {maxPoints} points • {filledFields}/{totalFields} questions completed
              {incompleteFields > 0 && (
                <span className="ml-2">• {incompleteFields} incomplete (-{incompleteFields * 5} points)</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white text-2xl font-bold mb-1">
              {score >= maxPoints * 0.9 ? '🏆' : score >= maxPoints * 0.7 ? '⭐' : score >= maxPoints * 0.5 ? '👍' : '💪'}
            </div>
            <div className="text-indigo-100 text-xs">
              {score >= maxPoints * 0.9 ? 'Perfect!' : score >= maxPoints * 0.7 ? 'Great!' : score >= maxPoints * 0.5 ? 'Good!' : 'Keep going!'}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-indigo-300/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${(score / maxPoints) * 100}%` }}
            />
          </div>
        </div>
      </div>

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
               'Start typing to begin the 200-second challenge'}
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
        <p className="text-sm text-gray-700 mb-3">
          You have <strong>200 seconds</strong> to fill out as many fields as possible. 
          The timer starts as soon as you begin typing. Answer quickly but naturally!
        </p>
        <div className="bg-white p-3 rounded border border-indigo-200">
          <p className="text-sm font-semibold text-gray-800 mb-1">📊 Scoring System:</p>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>Complete all questions to earn <strong>maximum points ({maxPoints} points)</strong></li>
            <li>You lose <strong>5 points</strong> for each incomplete question</li>
            <li>Your current score is displayed at the top</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <DataCollectionForm
        formData={formData}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        disabled={timerExpired}
        onFieldFocus={handleFieldFocus} 
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />
    </div>
  );
}