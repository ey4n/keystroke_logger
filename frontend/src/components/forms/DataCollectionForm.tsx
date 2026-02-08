'use client';

import React, { useState } from 'react';
import { FormData } from '../../types/formdata';
import { FormSection, ShortInputField, LongTextArea } from './FormFields';
import { Question, TranscriptionQuestion } from '../../types/questionpool';

export interface DataCollectionFormProps {
  formData: FormData;
  questions: {
    requiredShort: Question[];
    short: Question[];
    directLong: Question[];
    indirectLong: Question[];
    transcription: TranscriptionQuestion[];
  };
  onInputChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBeforeInput?: (ev: { data?: string | null; inputType?: string }) => void;
  onFieldFocus?: (fieldName: keyof FormData) => void;
  onFieldBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DataCollectionForm: React.FC<DataCollectionFormProps> = ({
  formData,
  questions,
  onInputChange,
  onKeyDown,
  onKeyUp,
  onBeforeInput,
  onFieldFocus,
  onFieldBlur,
  disabled = false,
  className = ''
}) => {
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(true);

  const handleFocus = (fieldName: keyof FormData) => () => {
    if (onFieldFocus) onFieldFocus(fieldName);
  };

  const handleBlur = () => {
    if (onFieldBlur) onFieldBlur();
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Personal Details Section */}
      {(questions.requiredShort.length > 0 || questions.short.length > 0) && (
        <FormSection title="Personal Details">
          {/* Required questions first (Full Name) */}
          {questions.requiredShort.map((question) => (
            <ShortInputField
              key={question.id}
              label={question.label}
              value={formData[question.id] || ''}
              onChange={onInputChange(question.id)}
              onKeyDown={onKeyDown as any}
              onKeyUp={onKeyUp as any}
              onBeforeInput={onBeforeInput}
              onFocus={handleFocus(question.id)}
              onBlur={handleBlur}
              disabled={disabled}
            />
          ))}
          {/* Then random short questions */}
          {questions.short.map((question) => (
            <ShortInputField
              key={question.id}
              label={question.label}
              value={formData[question.id] || ''}
              onChange={onInputChange(question.id)}
              onKeyDown={onKeyDown as any}
              onKeyUp={onKeyUp as any}
              onBeforeInput={onBeforeInput}
              onFocus={handleFocus(question.id)}
              onBlur={handleBlur}
              disabled={disabled}
            />
          ))}
        </FormSection>
      )}

      {/* Tell Us About Yourself Section - Direct Long Questions */}
      {questions.directLong.length > 0 && (
        <FormSection title="Tell Us About Yourself">
          {questions.directLong.map((question) => (
            <LongTextArea
              key={question.id}
              label={question.label}
              value={formData[question.id] || ''}
              onChange={onInputChange(question.id)}
              onKeyDown={onKeyDown as any}
              onKeyUp={onKeyUp as any}
              onBeforeInput={onBeforeInput}
              onFocus={handleFocus(question.id)}
              onBlur={handleBlur}
              disabled={disabled}
            />
          ))}
        </FormSection>
      )}

      {/* Reflections Section - Indirect Long Questions */}
      {questions.indirectLong.length > 0 && (
        <FormSection title="Reflections & Insights">
          {questions.indirectLong.map((question) => (
            <LongTextArea
              key={question.id}
              label={question.label}
              value={formData[question.id] || ''}
              onChange={onInputChange(question.id)}
              onKeyDown={onKeyDown as any}
              onKeyUp={onKeyUp as any}
              onBeforeInput={onBeforeInput}
              onFocus={handleFocus(question.id)}
              onBlur={handleBlur}
              disabled={disabled}
            />
          ))}
        </FormSection>
      )}

      {/* Transcription Task Section */}
      {questions.transcription.length > 0 && (
        <FormSection title="Transcription Task">
          {questions.transcription.map((transcriptionQ) => (
            <div key={transcriptionQ.id} className="space-y-4">
              {/* Sticky, collapsible reference paragraph */}
              <div className="sticky top-0 z-10 -mx-1 px-1 bg-gray-50 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTranscriptionExpanded(!transcriptionExpanded)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800">
                    {transcriptionExpanded ? '▼ Reference paragraph (click to collapse)' : '▶ Reference paragraph (click to show)'}
                  </span>
                </button>
                {transcriptionExpanded && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 mb-3">
                      {transcriptionQ.instructions}
                    </p>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-mono">
                        "{transcriptionQ.paragraph}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <LongTextArea
                label={transcriptionQ.label}
                value={formData[transcriptionQ.id] || ''}
                onChange={onInputChange(transcriptionQ.id)}
                onKeyDown={onKeyDown as any}
                onKeyUp={onKeyUp as any}
                onBeforeInput={onBeforeInput}
                onFocus={handleFocus(transcriptionQ.id)}
                onBlur={handleBlur}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                disabled={disabled}
                rows={6}
              />
            </div>
          ))}
        </FormSection>
      )}
    </div>
  );
};