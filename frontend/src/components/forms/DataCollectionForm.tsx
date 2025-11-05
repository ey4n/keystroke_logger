
import React from 'react';
import { FormData } from '../../types/formdata';
import { FormSection, ShortInputField, LongTextArea } from './FormFields'

export interface DataCollectionFormProps {
  formData: FormData;
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
        <LongTextArea
          label="Describe your typical morning routine"
          value={formData.morningRoutine}
          onChange={onInputChange('morningRoutine')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('morningRoutine')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="What's your favorite memory from the past year?"
          value={formData.favoriteMemory}
          onChange={onInputChange('favoriteMemory')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('favoriteMemory')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="How do you typically spend your weekends?"
          value={formData.weekendActivity}
          onChange={onInputChange('weekendActivity')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('weekendActivity')}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </FormSection>
    </div>
  );
};
