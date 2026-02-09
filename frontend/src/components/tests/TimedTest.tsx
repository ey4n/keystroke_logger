'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { useActiveTypingTimer } from '../../hooks/useActiveTypingTimer';
import { FormData, createInitialFormData } from '../../types/formdata';
import { ShortInputField } from '../forms/FormFields';
import { generateQuestionSet, QuestionSet, Question, TranscriptionQuestion } from '../../types/questionpool';

const LONG_QUESTION_MAX_CHARS = 150;

interface TimedTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
    getActiveTypingTime: () => number; // Add active typing time getter
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

  const TOTAL_SECONDS = 240;
  const allLongQuestions: Question[] = useMemo(() => {
    return [...questionSet.directLong, ...questionSet.indirectLong];
  }, [questionSet]);

  type Step = 'personal' | number | 'transcription' | 'complete';
  const [step, setStep] = useState<Step>('personal');
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(true);

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

  // Initialize active typing timer
  const typingTimer = useActiveTypingTimer();
  
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
        // Pause typing timer when warning appears
        typingTimer.pauseTimer();
        break;
      }
    }
  }, [elapsedTime, isTimerActive, timerExpired, typingTimer]);

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
      },
      getActiveTypingTime: typingTimer.getActiveTime,
    });
  }, [formData, timeLeft, timerExpired, elapsedTime, completionPercentage, typingTimer.getActiveTime]);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setTimerExpired(true);
            // Stop typing timer when time expires
            typingTimer.stopTimer();
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
  }, [isTimerActive, timeLeft, typingTimer]);

  // When user clicks Save Data, stop timer, clear popups, and lock form
  useEffect(() => {
    const handleSaveClicked = () => {
      setIsTimerActive(false);
      setTimeWarningMessage(null);
      setTimerExpired(true);
      typingTimer.stopTimer();
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
      typingTimer.startTimer();
    }
  };

  // Handle key events to track typing activity
  const handleKeyDown = (e: React.KeyboardEvent) => {
    logKeyDown(e as any);
    typingTimer.recordKeystroke();

    // Continue typing timer on keystroke if it was paused
    if (hasStarted && typingTimer.isPaused && !timeWarningMessage) {
      typingTimer.resumeTimer();
    }
  };

  // Handle dismissing time warning
  const dismissTimeWarning = () => {
    setTimeWarningMessage(null);
    typingTimer.resumeTimer();
  };

  const goNext = () => {
    if (step === 'personal') {
      setStep(0);
      return;
    }
    if (typeof step === 'number') {
      if (step + 1 < allLongQuestions.length) setStep(step + 1);
      else setStep('transcription');
      return;
    }
    if (step === 'transcription') setStep('complete');
  };

  const goBack = () => {
    if (typeof step === 'number') {
      if (step === 0) setStep('personal');
      else setStep(step - 1);
      return;
    }
    if (step === 'transcription') setStep(allLongQuestions.length - 1);
    if (step === 'complete') setStep('transcription');
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

      {/* Stepped form: Personal → Long questions → Transcription → Complete */}
      {step === 'personal' && (() => {
        const totalFields = allQuestionIds.length;
        const filledFields = allQuestionIds.filter(id => (formData[id] || '').trim() !== '').length;
        const completionPercentage = Math.round((filledFields / totalFields) * 100);
        return (
        <>
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
            <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
            <p className="text-sm text-gray-700 mb-3">
              You have <strong>5 minutes (300 seconds)</strong> to fill out as many fields as possible.
              The timer starts when you begin typing. Answer quickly but naturally!
            </p>
            <div className="bg-white p-3 rounded border border-indigo-200">
              <p className="text-sm font-semibold text-gray-800 mb-1">📊 Scoring System:</p>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Complete all questions to earn <strong>maximum points ({maxPoints} points)</strong></li>
                <li>You lose <strong>5 points</strong> for each incomplete question</li>
                <li>Your current score is displayed at the top</li>
              </ul>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Progress: <strong>{completionPercentage}% Complete</strong> ({filledFields}/{totalFields} fields)
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Details</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>KEYSTROKES RECORDING</span>
            </div>
          </div>
          <div className="space-y-6 mb-6">
            {[...questionSet.requiredShort, ...questionSet.short].map((q) => (
              <ShortInputField
                key={q.id}
                label={q.label}
                value={formData[q.id] || ''}
                onChange={handleInputChange(q.id)}
                onKeyDown={handleKeyDown}
                onKeyUp={logKeyUp as any}
                onBeforeInput={logInputFallback}
                onFocus={() => handleFieldFocus(q.id)}
                disabled={timerExpired}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px]"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </>
        );
      })()}

      {typeof step === 'number' && allLongQuestions[step] && (() => {
        const q = allLongQuestions[step];
        const value = formData[q.id] || '';
        const isDirectLong = step < questionSet.directLong.length;
        const sectionTitle = isDirectLong ? 'Tell Us About Yourself' : 'Reflections & Insights';
        return (
          <div className="min-h-[360px] flex flex-col bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sectionTitle}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>KEYSTROKES RECORDING</span>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{q.label}</h2>
            <p className="text-sm text-gray-500 italic mb-4">Write at least 2 sentences.</p>
            <textarea
              value={value}
              onChange={handleInputChange(q.id)}
              onKeyDown={handleKeyDown}
              onKeyUp={logKeyUp as any}
              onBeforeInput={logInputFallback ? (e) => {
                const n = e.nativeEvent as InputEvent;
                logInputFallback({ data: n.data, inputType: n.inputType });
              } : undefined}
              onFocus={() => handleFieldFocus(q.id)}
              maxLength={LONG_QUESTION_MAX_CHARS}
              placeholder="Start typing here..."
              rows={5}
              disabled={timerExpired}
              className="w-full min-h-[160px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
            />
            <div className="mt-2 text-center text-sm text-gray-500">
              <span className="text-purple-600 font-medium">{value.length}</span>
              <span> / {LONG_QUESTION_MAX_CHARS} characters</span>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <button type="button" onClick={goBack} className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                Back
              </button>
              <button type="button" onClick={goNext} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px]">
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        );
      })()}

      {step === 'transcription' && questionSet.transcription.length > 0 && (() => {
        const t = questionSet.transcription[0] as TranscriptionQuestion;
        const value = formData[t.id] || '';
        return (
          <div className="min-h-[360px] flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transcription Task</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>KEYSTROKES RECORDING</span>
              </div>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <button type="button" onClick={() => setTranscriptionExpanded(!transcriptionExpanded)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-semibold text-gray-800">
                  {transcriptionExpanded ? '▼ Reference paragraph (click to collapse)' : '▶ Reference paragraph (click to show)'}
                </span>
              </button>
              {transcriptionExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">{t.instructions}</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed font-mono">"{t.paragraph}"</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.label}</h2>
              <textarea
                value={value}
                onChange={handleInputChange(t.id)}
                onKeyDown={handleKeyDown}
                onKeyUp={logKeyUp as any}
                onBeforeInput={logInputFallback ? (e) => { const n = e.nativeEvent as InputEvent; logInputFallback({ data: n.data, inputType: n.inputType }); } : undefined}
                onFocus={() => handleFieldFocus(t.id)}
                placeholder="Type the paragraph here..."
                rows={5}
                disabled={timerExpired}
                className="w-full min-h-[160px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
              />
              <div className="mt-2 text-center text-sm text-gray-500">
                <span className="text-purple-600 font-medium">{value.length}</span>
                <span> / {t.paragraph.length} characters</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <button type="button" onClick={goBack} className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                Back
              </button>
              <button type="button" onClick={goNext} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px]">
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        );
      })()}

      {step === 'complete' && (
        <div className="min-h-[240px] flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re done!</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Click &quot;End Test&quot; and complete the post survey questionnaire to submit your responses.
          </p>
          <button type="button" onClick={goBack} className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
}