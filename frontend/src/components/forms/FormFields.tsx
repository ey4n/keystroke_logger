import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ title, children }: FormSectionProps) => (
  <div className="mb-10">
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
      {title}
    </h3>
    <div className="space-y-8">
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
  onBeforeInput?: (ev: { data?: string | null; inputType?: string }) => void;
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
  onBeforeInput,
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <label className="block text-base font-semibold text-gray-900 mb-1">
        {label}
      </label>
      {isAgeField && (
        <p className="text-xs text-gray-500 mb-3">Digits only</p>
      )}
      <input
        type={inputType}
        inputMode={isAgeField ? 'numeric' : undefined}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        onBeforeInput={onBeforeInput ? (e) => {
          const n = e.nativeEvent as InputEvent;
          onBeforeInput({ data: n.data, inputType: n.inputType });
        } : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={isAgeField ? 3 : undefined}
        placeholder={isAgeField ? 'e.g. 24' : undefined}
        className={`w-full min-h-[52px] px-4 py-3 text-base border rounded-xl outline-none transition-all ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
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
  onBeforeInput?: (ev: { data?: string | null; inputType?: string }) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onCopy?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
}

export const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  onBeforeInput,
  onFocus,
  onBlur,
  onPaste,
  onCopy,
  disabled = false,
  rows = 3
}: LongTextAreaProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <label className="block text-base font-semibold text-gray-900 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBeforeInput={onBeforeInput ? (e) => {
          const n = e.nativeEvent as InputEvent;
          onBeforeInput({ data: n.data, inputType: n.inputType });
        } : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={onPaste}
        onCopy={onCopy}
        disabled={disabled}
        rows={rows}
        placeholder="Type naturally here..."
        className={`w-full min-h-[120px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
        }`}
      />
    </div>
  );
};