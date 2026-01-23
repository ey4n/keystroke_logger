import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ title, children }: FormSectionProps) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold text-gray-700 mb-3">
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

interface ShortInputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  max?: number;
}

export const ShortInputField = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  disabled = false,
  type,
  max
}: ShortInputFieldProps) => {
  const isAgeField = label.toLowerCase() === 'age';
  const inputType = type || (isAgeField ? 'text' : 'text'); // Use text type for better control
  const maxValue = max !== undefined ? max : (isAgeField ? 100 : undefined);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Call the original onKeyDown for keystroke logging
    if (onKeyDown) onKeyDown(e);
    
    // For age fields, prevent non-numeric keys
    if (isAgeField) {
      const key = e.key;
      // Allow: backspace, delete, tab, escape, enter, and arrow keys
      if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
        return;
      }
      // Allow: Ctrl/Cmd + A, C, V, X, Z (for copy/paste/undo)
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
        return;
      }
      // Only allow digits 0-9
      if (!/^\d$/.test(key)) {
        e.preventDefault();
        return;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAgeField) {
      const inputValue = e.target.value;
      // Allow empty string for clearing
      if (inputValue === '') {
        onChange(e);
        return;
      }
      // Remove any non-digit characters (handles paste events)
      const numericValue = inputValue.replace(/\D/g, '');
      if (numericValue !== inputValue) {
        // Create a new event with the filtered value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: numericValue
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
        return;
      }
      // Check max value
      const numValue = parseInt(numericValue, 10);
      if (maxValue !== undefined && numValue > maxValue) {
        // Clamp to max value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: maxValue.toString()
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
        return;
      }
    }
    onChange(e);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={inputType}
        inputMode={isAgeField ? 'numeric' : undefined}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={isAgeField ? 3 : undefined}
        className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition-all ${
          disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
        }`}
      />
    </div>
  );
};

interface LongTextAreaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
}

export const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  disabled = false,
  rows = 3
}: LongTextAreaProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        rows={rows}
        className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition-all resize-none ${
          disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
        }`}
      />
    </div>
  );
};