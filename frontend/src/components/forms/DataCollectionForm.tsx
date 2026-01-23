
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
        <LongTextArea
          label="Describe a recent experience that you found calm or relaxing."
          value={formData.calmExperience}
          onChange={onInputChange('calmExperience')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('calmExperience')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Describe a recent situation where you felt stressed, pressured, or overwhelmed."
          value={formData.stressfulSituation}
          onChange={onInputChange('stressfulSituation')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('stressfulSituation')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="What would be your ideal holiday?"
          value={formData.idealHoliday}
          onChange={onInputChange('idealHoliday')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('idealHoliday')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Where do you see yourself 5 years from now?"
          value={formData.fiveYearsFromNow}
          onChange={onInputChange('fiveYearsFromNow')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('fiveYearsFromNow')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Describe how you usually plan your day when you wake up."
          value={formData.dayPlanning}
          onChange={onInputChange('dayPlanning')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('dayPlanning')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Explain how you usually keep track of tasks, reminders, or deadlines."
          value={formData.taskTracking}
          onChange={onInputChange('taskTracking')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('taskTracking')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Describe how you typically respond when your plans change unexpectedly."
          value={formData.unexpectedChanges}
          onChange={onInputChange('unexpectedChanges')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('unexpectedChanges')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Describe something you learned recently that you found useful."
          value={formData.recentLearning}
          onChange={onInputChange('recentLearning')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('recentLearning')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Explain how you usually make decisions when choosing between options."
          value={formData.decisionMaking}
          onChange={onInputChange('decisionMaking')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('decisionMaking')}
          onBlur={handleBlur}
          disabled={disabled}
        />
        <LongTextArea
          label="Describe how you would explain a simple task or process to someone unfamiliar with it."
          value={formData.explainingTasks}
          onChange={onInputChange('explainingTasks')}
          onKeyDown={onKeyDown as any}
          onKeyUp={onKeyUp as any}
          onFocus={handleFocus('explainingTasks')}
          onBlur={handleBlur}
          disabled={disabled}
        />
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
