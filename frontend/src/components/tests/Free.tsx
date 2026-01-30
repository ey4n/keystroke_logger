'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, createInitialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { generateQuestionSet, QuestionSet } from '../../types/questionpool';

interface FreeTypingTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
  }) => void;
}

export function Free({ sessionId, onTestDataUpdate }: FreeTypingTestProps) {
  // Generate random question set once when component mounts
  const questionSet: QuestionSet = useMemo(() => {
    return generateQuestionSet(3, 4, 4); // 4 short, 4 direct long, 4 indirect long
  }, []); // Empty dependency array ensures this only runs once

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

  const [formData, setFormData] = useState<FormData>(() => 
    createInitialFormData(allQuestionIds)
  );

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
      formData: {
        ...formData,
        questionSet: questionSet, // Include which questions were shown
      }
    });
  }, [formData, getLogs, getAnalytics]);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const totalFields = allQuestionIds.length;
  const filledFields = allQuestionIds.filter(id => formData[id]?.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  const handleFieldFocus = (fieldName: keyof FormData) => {
    console.log('question:', fieldName);
    setFieldName(String(fieldName));
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
        questions={questionSet}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        onFieldFocus={handleFieldFocus}
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />
    </div>
  );
}