'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { useActiveTypingTimer } from '../../hooks/useActiveTypingTimer';
import { FormData, createInitialFormData } from '../../types/formdata';
import { ShortInputField } from '../forms/FormFields';
import { generateQuestionSet, QuestionSet, Question, TranscriptionQuestion } from '../../types/questionpool';

const LONG_QUESTION_MAX_CHARS = 500;

interface FreeTypingTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
    getActiveTypingTime: () => number; 
  }) => void;
  onFlowComplete?: () => void;
}

export function Free({ sessionId, onTestDataUpdate, onFlowComplete }: FreeTypingTestProps) {
  const questionSet: QuestionSet = useMemo(() => {
    return generateQuestionSet(3, 4, 4);
  }, []);

  const allLongQuestions: Question[] = useMemo(() => {
    return [...questionSet.directLong, ...questionSet.indirectLong];
  }, [questionSet]);

  const allQuestionIds = useMemo(() => {
    return [
      ...questionSet.requiredShort.map(q => q.id),
      ...questionSet.short.map(q => q.id),
      ...questionSet.directLong.map(q => q.id),
      ...questionSet.indirectLong.map(q => q.id),
      ...questionSet.transcription.map(q => q.id),
    ];
  }, [questionSet]);

  const [formData, setFormData] = useState<FormData>(() =>
    createInitialFormData(allQuestionIds)
  );

  type Step = 'personal' | number | 'transcription' | 'complete';
  const [step, setStep] = useState<Step>('personal');
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(true);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  const {
    logKeyDown,
    logKeyUp,
    logInputFallback,
    getLogs,
    getAnalytics,
    setFieldName,
  } = useKeystrokeLogger(sessionId);

  // Initialize active typing timer
  const typingTimer = useActiveTypingTimer();

  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
      formData: { ...formData, questionSet },
      getActiveTypingTime: typingTimer.getActiveTime,
    });
  }, [formData, getLogs, getAnalytics, onTestDataUpdate, questionSet, typingTimer.getActiveTime]);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Start timer on first keystroke
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      typingTimer.startTimer();
    }
  };

  // Track keydown events to update timer on last keystroke
  const handleKeyDown = (e: React.KeyboardEvent) => {
    logKeyDown(e as any);
    typingTimer.recordKeystroke();
  
    // Restart/continue timer on any keystroke (in case it was paused)
    if (hasStartedTyping && !typingTimer.isActive) {
      typingTimer.startTimer();
    }
  };

  const handleFieldFocus = (fieldName: keyof FormData) => {
    setFieldName(String(fieldName));
  };

  const goNext = () => {
    if (step === 'personal') {
      setStep(0);
      return;
    }
    if (typeof step === 'number') {
      if (step + 1 < allLongQuestions.length) {
        setStep(step + 1);
      } else {
        setStep('transcription');
      }
      return;
    }
    if (step === 'transcription') {
      setStep('complete');
      // Stop timer when test is complete
      typingTimer.stopTimer();
      onFlowComplete?.();
    }
  };

  const goBack = () => {
    if (typeof step === 'number') {
      if (step === 0) setStep('personal');
      else setStep(step - 1);
      return;
    }
    if (step === 'transcription') {
      setStep(allLongQuestions.length - 1);
      return;
    }
    if (step === 'complete') {
      setStep('transcription');
    }
  };

  // — Personal details: single screen —
  if (step === 'personal') {
    const allShort = [...questionSet.requiredShort, ...questionSet.short];
    const totalFields = allQuestionIds.length;
    const filledFields = allQuestionIds.filter(id => (formData[id] || '').trim() !== '').length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    return (
      <div className="min-h-[400px] flex flex-col">
        <div className="mb-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
          <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
          <p className="text-sm text-gray-700">
            Fill out the form below at your own pace. Take your time and answer naturally.
          </p>
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
        <div className="space-y-6 flex-1">
          {allShort.map((q) => (
            <ShortInputField
              key={q.id}
              label={q.label}
              value={formData[q.id] || ''}
              onChange={handleInputChange(q.id)}
              onKeyDown={handleKeyDown}
              onKeyUp={logKeyUp as any}
              onBeforeInput={logInputFallback}
              onFocus={() => handleFieldFocus(q.id)}
              disabled={false}
            />
          ))}
        </div>
        <div className="mt-8 flex justify-end">
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
      </div>
    );
  }

  // — One long question per screen —
  if (typeof step === 'number' && allLongQuestions[step]) {
    const q = allLongQuestions[step];
    const value = formData[q.id] || '';
    const charCount = value.length;
    const isDirectLong = step < questionSet.directLong.length;
    const sectionTitle = isDirectLong ? 'Tell Us About Yourself' : 'Reflections & Insights';

    return (
      <div className="min-h-[400px] flex flex-col bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sectionTitle}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>KEYSTROKES RECORDING</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{q.label}</h2>
          <p className="text-sm text-gray-500 italic mb-6">Write at least 2 sentences.</p>
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
            rows={6}
            className="w-full min-h-[200px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
          />
          <div className="mt-3 text-center text-sm text-gray-500">
            <span className="text-purple-600 font-medium">{charCount}</span>
            <span> / {LONG_QUESTION_MAX_CHARS} characters</span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back
          </button>
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
      </div>
    );
  }

  // — Transcription: single screen —
  if (step === 'transcription' && questionSet.transcription.length > 0) {
    const t = questionSet.transcription[0] as TranscriptionQuestion;
    const value = formData[t.id] || '';
    const charCount = value.length;
    const paraLen = t.paragraph.length;

    return (
      <div className="min-h-[400px] flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transcription Task</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>KEYSTROKES RECORDING</span>
          </div>
        </div>
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setTranscriptionExpanded(!transcriptionExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
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
            onBeforeInput={logInputFallback ? (e) => {
              const n = e.nativeEvent as InputEvent;
              logInputFallback({ data: n.data, inputType: n.inputType });
            } : undefined}
            onFocus={() => handleFieldFocus(t.id)}
            placeholder="Type the paragraph here..."
            rows={6}
            className="w-full min-h-[180px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
          />
          <div className="mt-3 text-center text-sm text-gray-500">
            <span className="text-purple-600 font-medium">{charCount}</span>
            <span> / {paraLen} characters</span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back
          </button>
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
      </div>
    );
  }

  // — Complete: show message, data panel is shown by parent —
  if (step === 'complete') {
    return (
      <div className="min-h-[280px] flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re done!</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Scroll down and click &quot;Show All Data&quot;, then &quot;Save to Supabase&quot; to submit your responses.
        </p>
        <button
          type="button"
          onClick={goBack}
          className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back
        </button>
      </div>
    );
  }

  return null;
}