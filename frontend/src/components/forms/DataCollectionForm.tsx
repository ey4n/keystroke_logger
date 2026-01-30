import React from 'react';
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
  onFieldFocus,
  onFieldBlur,
  disabled = false,
  className = ''
}) => {
  const handleFocus = (fieldName: keyof FormData) => () => {
    if (onFieldFocus) onFieldFocus(fieldName);
  };

  const handleBlur = () => {
    if (onFieldBlur) onFieldBlur();
  };

  return (
    <div className={className}>
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
            <div key={transcriptionQ.id}>
              <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 mb-2">Instructions:</p>
                <p className="text-sm text-gray-700 mb-3">
                  {transcriptionQ.instructions}
                </p>
                <div className="bg-white p-4 rounded border border-blue-300">
                  <p className="text-sm text-gray-800 leading-relaxed font-mono">
                    "{transcriptionQ.paragraph}"
                  </p>
                </div>
              </div>
              <LongTextArea
                label={transcriptionQ.label}
                value={formData[transcriptionQ.id] || ''}
                onChange={onInputChange(transcriptionQ.id)}
                onKeyDown={onKeyDown as any}
                onKeyUp={onKeyUp as any}
                onFocus={handleFocus(transcriptionQ.id)}
                onBlur={handleBlur}
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