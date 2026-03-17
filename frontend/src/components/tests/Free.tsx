'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
<<<<<<< Updated upstream
import { FormData, initialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { getQuestionsForTest } from '../../data/questionBanks';
=======
import { useActiveTypingTimer } from '../../hooks/useActiveTypingTimer';
import { FormData, createInitialFormData } from '../../types/formdata';
import { ShortInputField } from '../forms/FormFields';
import { generateQuestionSet, QuestionSet, Question, TranscriptionQuestion } from '../../types/questionpool';
import { computeFormSpellingSummary } from '../../utils/spelling';

const LONG_QUESTION_MAX_CHARS = 150;
>>>>>>> Stashed changes

interface FreeTypingTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
  }) => void;
}

export function Free({ sessionId, onTestDataUpdate }: FreeTypingTestProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const {
    logKeyDown,
    logKeyUp,
    clearLogs,
    getLogs,
    getAnalytics,
    setFieldName
  } = useKeystrokeLogger(sessionId);

<<<<<<< Updated upstream
  // Update parent with current data functions and form data
=======
  // Initialize active typing timer
  const typingTimer = useActiveTypingTimer();

  const allQuestionIdsArray = useMemo(
    () => allQuestionIds.map(String).filter((id) => id !== 'fullName'),
    [allQuestionIds],
  );

  const spellingSummary = useMemo(
    () => computeFormSpellingSummary(formData as any, allQuestionIdsArray),
    [formData, allQuestionIdsArray],
  );

>>>>>>> Stashed changes
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
<<<<<<< Updated upstream
      formData
    });
  }, [formData, getLogs, getAnalytics]);
=======
      formData: {
        ...formData,
        questionSet,
        spellingErrorsTotal: spellingSummary.total,
        spellingErrorsByQuestion: spellingSummary.perQuestion,
      },
      getActiveTypingTime: typingTimer.getActiveTime,
    });
  }, [
    formData,
    getLogs,
    getAnalytics,
    onTestDataUpdate,
    questionSet,
    typingTimer.getActiveTime,
    spellingSummary.total,
    spellingSummary.perQuestion,
  ]);
>>>>>>> Stashed changes

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const categoryQuestions = useMemo(() => getQuestionsForTest(sessionId, 'free'), [sessionId]);

  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  const handleFieldFocus = (fieldName: keyof FormData) => {
    console.log('question:', fieldName);
    setFieldName(fieldName);  // ← Finally calls setFieldName!
  };

  return (
    <div>
      {/* Instructions */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
        <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
        <p className="text-sm text-gray-700">
          Fill out the form below at your own pace. Take your time and answer naturally.
        </p>
        <div className="mt-2 text-sm text-gray-600">
          Progress: <strong>{completionPercentage}% Complete</strong> ({filledFields}/{totalFields} fields)
        </div>
      </div>

      {/* Form */}
      <DataCollectionForm
        formData={formData}
        categoryQuestions={categoryQuestions}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        onFieldFocus={handleFieldFocus}
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />
    </div>
  );
}