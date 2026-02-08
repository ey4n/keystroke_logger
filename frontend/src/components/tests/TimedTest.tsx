'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, createInitialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { generateQuestionSet, QuestionSet } from '../../types/questionpool';

interface TimedTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
  }) => void;
}

export function TimedTest({ sessionId, onTestDataUpdate }: TimedTestProps) {
  // Generate random question set once when component mounts
  const questionSet: QuestionSet = useMemo(() => {
    return generateQuestionSet(3, 4, 4); // 4 short, 4 direct long, 4 indirect long
  }, []);

  // Get all question IDs for form initialization
  const allQuestionIds = useMemo(() => {
    return [
      ...questionSet.requiredShort.map(q => q.id),
      ...questionSet.short.map(q => q.id),
      ...questionSet.directLong.map(q => q.id),
      ...questionSet.indirectLong.map(q => q.id),
      ...questionSet.transcription.map(q => q.id),
    ];
  }, [questionSet]);

  const TOTAL_SECONDS = 120;
  const [formData, setFormData] = useState<FormData>(() => 
    createInitialFormData(allQuestionIds)
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeWarningMessage, setTimeWarningMessage] = useState<string | null>(null);
  
  const { 
    logKeyDown, 
    logKeyUp, 
    logInputFallback,
    clearLogs, 
    getLogs, 
    getAnalytics,
    setFieldName
  } = useKeystrokeLogger();
  
  const timerRef = useRef<number | null>(null);
  const shownThresholdsRef = useRef<Set<number>>(new Set());

  // Calculate elapsed time
  const elapsedTime = startTime ? TOTAL_SECONDS - timeLeft : 0;

  // Every 20% of time gone, show a reminder (20%, 40%, 60%, 80%); user must acknowledge to continue
  useEffect(() => {
    if (!isTimerActive || timerExpired) return;
    const elapsed = elapsedTime;
    const thresholds = [
      { pct: 20, sec: TOTAL_SECONDS * 0.2, msg: '20% of your time is gone! You have 80% left.' },
      { pct: 40, sec: TOTAL_SECONDS * 0.4, msg: '40% of your time is gone! You have 60% left.' },
      { pct: 60, sec: TOTAL_SECONDS * 0.6, msg: '60% of your time is gone! You have 40% left.' },
      { pct: 80, sec: TOTAL_SECONDS * 0.8, msg: '80% of your time is gone! Only 20% left!' },
    ];
    for (const { pct, sec, msg } of thresholds) {
      if (elapsed >= sec && !shownThresholdsRef.current.has(pct)) {
        shownThresholdsRef.current.add(pct);
        setTimeWarningMessage(msg);
        break;
      }
    }
  }, [elapsedTime, isTimerActive, timerExpired]);

  // Calculate completion percentage
  const totalFields = allQuestionIds.length;
  const filledFields = allQuestionIds.filter(id => formData[id]?.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Calculate points: max points for completing all, -5 for each incomplete question
  const maxPoints = totalFields * 5; // 5 points per question
  const incompleteFields = totalFields - filledFields;
  const score = Math.max(0, maxPoints - (incompleteFields * 5));

  const handleFieldFocus = (fieldName: keyof FormData) => {
    console.log('question:', fieldName);
    setFieldName(String(fieldName));
  };

  // Update parent with current data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
        formData: {
          timeLimit: TOTAL_SECONDS,
        timeElapsed: elapsedTime,
        timeRemaining: timeLeft,
        timerExpired,
        completionPercentage,
        filledFields,
        totalFields,
        score,
        maxPoints,
        formSnapshot: formData,
        questionSet: questionSet, // Include which questions were shown
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

  // When user clicks Save Data, stop timer, clear popups, and lock form
  useEffect(() => {
    const handleSaveClicked = () => {
      setIsTimerActive(false);
      setTimeWarningMessage(null);
      setTimerExpired(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    window.addEventListener('timed-test-save-clicked', handleSaveClicked);
    return () => window.removeEventListener('timed-test-save-clicked', handleSaveClicked);
  }, []);

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
              {score >= maxPoints * 0.9 ? '🏆' : score >= maxPoints * 0.7 ? '⭐' : score >= maxPoints * 0.5 ? '💪' : '📈'}
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

      {/* Time warning modal (every 20% gone) — centered popup, must acknowledge to continue */}
      {timeWarningMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border-4 border-red-500 bg-white p-8 shadow-2xl animate-pulse">
            <div className="text-center">
              <div className="mb-4 text-6xl">⏰</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Time reminder</h3>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {timeWarningMessage}
              </p>
              <p className="text-sm text-red-600 mb-6">Keep going — time is running out!</p>
              <button
                type="button"
                onClick={() => setTimeWarningMessage(null)}
                className="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg shadow-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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
               'Start typing to begin the 2-minute challenge'}
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
          You have <strong>2 minutes (120 seconds)</strong> to fill out as many fields as possible. 
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
        questions={questionSet}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        onBeforeInput={logInputFallback}
        disabled={timerExpired}
        onFieldFocus={handleFieldFocus} 
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />
    </div>
  );
}