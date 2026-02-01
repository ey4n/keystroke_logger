import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, createInitialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { generateQuestionSet, QuestionSet } from '../../types/questionpool';

interface ColourTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
  }) => void;
}

interface StressEvent {
  timestamp: number;
  duration: number;
  type: 'red-flash';
}

// ---- Stress induction settings -----------------
const STRESS_CONFIG = {
  minDelayMs: 5000,      // 5s minimum between stress events
  maxDelayMs: 15000,     // up to 15s between events
  flashDurationMs: 3000, // how long the red background lasts
  maxEvents: 15,         // total number of stress events
  intensityLevels: [
    { bgColor: 'rgb(254, 226, 226)', intensity: 'low' },     // red-100
    { bgColor: 'rgb(254, 202, 202)', intensity: 'medium' },  // red-200
    { bgColor: 'rgb(252, 165, 165)', intensity: 'high' },    // red-300
  ],
} as const;
// -----------------------------------------------

export function ColourTest({ sessionId, onTestDataUpdate }: ColourTestProps) {
  const questionSet: QuestionSet = useMemo(() => generateQuestionSet(3, 4, 4), []);
  const allQuestionIds = useMemo(() => [
    ...questionSet.requiredShort.map(q => q.id),
    ...questionSet.short.map(q => q.id),
    ...questionSet.directLong.map(q => q.id),
    ...questionSet.indirectLong.map(q => q.id),
    ...questionSet.transcription.map(q => q.id),
  ], [questionSet]);

  const [formData, setFormData] = useState<FormData>(() => createInitialFormData(allQuestionIds));
  const [hasStarted, setHasStarted] = useState(false);
  const [isStressActive, setIsStressActive] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [stressEvents, setStressEvents] = useState<StressEvent[]>([]);
  
  const stressTimerRef = useRef<number | null>(null);
  const stressEventsCountRef = useRef(0);

  const {
    logKeyDown, logKeyUp,
    setFieldName,
    clearLogs, getLogs, getAnalytics,
  } = useKeystrokeLogger(sessionId);

  const totalFields = allQuestionIds.length;
  const filledFields = allQuestionIds.filter(id => formData[id]?.trim() !== '').length;
  const completionPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  // Update parent with current data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
      formData: {
        completionPercentage,
        filledFields,
        totalFields,
        stressEventsTriggered: stressEventsCountRef.current,
        stressEvents: stressEvents,
        formSnapshot: formData,
      }
    });
  }, [formData, stressEvents, completionPercentage]);

  // Schedule next stress event
  const scheduleNextStressEvent = () => {
    if (stressEventsCountRef.current >= STRESS_CONFIG.maxEvents) return;

    const delay = STRESS_CONFIG.minDelayMs + 
                  Math.random() * (STRESS_CONFIG.maxDelayMs - STRESS_CONFIG.minDelayMs);
    
    stressTimerRef.current = window.setTimeout(() => {
      triggerStressEvent();
    }, delay);
  };

  // Trigger a stress event (red background flash)
  const triggerStressEvent = () => {
    // Randomly select intensity level
    const intensityLevel = STRESS_CONFIG.intensityLevels[
      Math.floor(Math.random() * STRESS_CONFIG.intensityLevels.length)
    ];

    const event: StressEvent = {
      timestamp: Date.now(),
      duration: STRESS_CONFIG.flashDurationMs,
      type: 'red-flash',
    };

    setStressEvents(prev => [...prev, event]);
    setIsStressActive(true);
    setBackgroundColor(intensityLevel.bgColor);
    stressEventsCountRef.current += 1;

    // Reset background after duration
    setTimeout(() => {
      setIsStressActive(false);
      setBackgroundColor('white');
      scheduleNextStressEvent();
    }, STRESS_CONFIG.flashDurationMs);
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    if (!hasStarted) {
      setHasStarted(true);
      scheduleNextStressEvent();
    }
  };

  const handleFieldFocus = (fieldName: keyof FormData) => {
    if (setFieldName) setFieldName(String(fieldName));
  };

  const handleFieldBlur = () => {
    if (setFieldName) setFieldName(undefined);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (stressTimerRef.current) clearTimeout(stressTimerRef.current);
    };
  }, []);

  return (
    <div 
      className="relative transition-colors duration-500"
      style={{ backgroundColor }}
    >
      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
        <p className="text-sm text-gray-700 mb-2">
          Complete the form while the background occasionally changes to red. 
          Try to maintain focus and accuracy despite the visual stress.
        </p>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Background will flash red at random intervals</div>
          <div>• Each flash lasts {STRESS_CONFIG.flashDurationMs / 1000} seconds</div>
          <div>• Total stress events: <strong>{stressEventsCountRef.current}/{STRESS_CONFIG.maxEvents}</strong></div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Form Progress: <strong>{completionPercentage}% Complete</strong> ({filledFields}/{totalFields} fields)
        </div>
      </div>

      {/* Stress indicator */}
      {isStressActive && (
        <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg text-center">
          <span className="text-red-700 font-semibold text-sm">
            🔴 STRESS EVENT ACTIVE
          </span>
        </div>
      )}

      {/* Form */}
      <DataCollectionForm
        formData={formData}
        questions={questionSet}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        onFieldFocus={handleFieldFocus}
        onFieldBlur={handleFieldBlur}
        disabled={false}
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />
    </div>
  );
}