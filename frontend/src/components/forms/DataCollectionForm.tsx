import React from 'react';
import { FormData } from '../../types/formdata';
import { FormSection, ShortInputField, LongTextArea } from './FormFields'

export interface DataCollectionFormProps {
  formData: FormData;
  /** One question per category (7 questions). If not provided, uses placeholder labels. */
  categoryQuestions?: string[];
  onInputChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFieldFocus?: (fieldName: keyof FormData) => void;
  onFieldBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

const CATEGORY_KEYS: (keyof FormData)[] = ['category1', 'category2', 'category3', 'category4', 'category5', 'category6', 'category7'];

export const DataCollectionForm: React.FC<DataCollectionFormProps> = ({
  formData,
  categoryQuestions = [],
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

  const questions = categoryQuestions.length >= 7 ? categoryQuestions : [
    'Describe your typical morning routine.',
    'Describe a recent experience that you found calm or relaxing.',
    'Describe a recent situation where you felt stressed or overwhelmed.',
    'Explain how you usually keep track of tasks and deadlines.',
    'Describe how you respond when your plans change unexpectedly.',
    'Explain how you usually make decisions when choosing between options.',
    'Describe how you would explain a simple task to someone unfamiliar with it.',
  ];

  return (
    <div className={className}>
      <FormSection title="Personal Details">
        <ShortInputField
          label="Full Name"
          value={formData.fullName}
          onChange={onInputChange('fullName')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('fullName')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <ShortInputField
          label="Email Address"
          value={formData.email}
          onChange={onInputChange('email')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('email')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <ShortInputField
          label="Age"
          value={formData.age}
          onChange={onInputChange('age')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('age')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <ShortInputField
          label="Occupation"
          value={formData.occupation}
          onChange={onInputChange('occupation')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('occupation')}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Tell Us About Yourself">
        {CATEGORY_KEYS.map((fieldKey, index) => (
          <LongTextArea
            key={fieldKey}
            label={questions[index] ?? `Question ${index + 1}`}
            value={formData[fieldKey]}
            onChange={onInputChange(fieldKey)}
            onKeyDown={onKeyDown as any}
            onKeyUp={onKeyUp as any}
            onFocus={handleFocus(fieldKey)}
            onBlur={handleBlur}
            disabled={disabled}
          />
        ))}
      </FormSection>

      {/* Transcription Task Section */}
      <FormSection title="Transcription Task">
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-gray-800 mb-2">Instructions:</p>
          <p className="text-sm text-gray-700 mb-3">
            Please read the paragraph below carefully, then type it exactly as shown in the text box.
          </p>
          <div className="bg-white p-4 rounded border border-blue-300">
            <p className="text-sm text-gray-800 leading-relaxed font-mono">
              "Modern workplaces often require individuals to manage multiple tasks under strict deadlines.
              Responding to emails, completing reports, and coordinating with others can become stressful,
              especially when unexpected changes occur. Maintaining focus and accuracy during such situations
              is important for effective performance."
            </p>
          </div>
        </div>
        <LongTextArea
          label="Type the paragraph above exactly as shown:"
          value={formData.transcription}
          onChange={onInputChange('transcription')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('transcription')}
          onBlur={handleBlur}
          disabled={disabled}
          rows={6}
        />
      </FormSection>
    </div>
  );
};
