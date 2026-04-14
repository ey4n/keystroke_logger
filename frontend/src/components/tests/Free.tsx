'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, initialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { getQuestionsForTest } from '../../data/questionBanks';

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

  // Update parent with current data functions and form data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
      formData
    });
  }, [formData, getLogs, getAnalytics]);

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