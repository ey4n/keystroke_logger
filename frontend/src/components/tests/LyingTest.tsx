// components/tests/LyingTest.tsx
import React, { useState, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';

interface LyingTestProps {
  sessionId: string;
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

interface FormData {
  fullName: string;
  email: string;
  age: string;
  occupation: string;
  morningRoutine: string;
  favoriteMemory: string;
  weekendActivity: string;
  calmExperience: string;
  stressfulSituation: string;
  idealHoliday: string;
  fiveYearsFromNow: string;
  dayPlanning: string;
  taskTracking: string;
  unexpectedChanges: string;
  recentLearning: string;
  decisionMaking: string;
  explainingTasks: string;
  transcription: string;
}

type FieldMode = 'truth' | 'lie';

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold text-gray-700 mb-3">
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ShortInputField = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  mode 
}: { 
  label: string; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  mode: FieldMode;
}) => {
  const isTruth = mode === 'truth';
  const isAgeField = label.toLowerCase() === 'age';
  
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
      // Check max value (100)
      const numValue = parseInt(numericValue, 10);
      if (numValue > 100) {
        // Clamp to max value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: '100'
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
      <label className={`block text-sm font-medium mb-1 ${isTruth ? 'text-green-700' : 'text-red-700'}`}>
        {label} {isTruth ? '✓ (Tell Truth)' : '✗ (Tell Lie)'}
      </label>
      <input
        type="text"
        inputMode={isAgeField ? 'numeric' : undefined}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        maxLength={isAgeField ? 3 : undefined}
        className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition-all ${
          isTruth 
            ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200' 
            : 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
        }`}
      />
    </div>
  );
};

const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  mode,
  rows = 3
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  mode: FieldMode;
  rows?: number;
}) => {
  const isTruth = mode === 'truth';
  
  return (
    <div>
      <label className={`block text-sm font-medium mb-1 ${isTruth ? 'text-green-700' : 'text-red-700'}`}>
        {label} {isTruth ? '✓ (Tell Truth)' : '✗ (Tell Lie)'}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        rows={rows}
        className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition-all resize-none ${
          isTruth 
            ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200' 
            : 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
        }`}
      />
    </div>
  );
};

export function LyingTest({ onShowData, onClearData, showData }: LyingTestProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    age: '',
    occupation: '',
    morningRoutine: '',
    favoriteMemory: '',
    weekendActivity: '',
    calmExperience: '',
    stressfulSituation: '',
    idealHoliday: '',
    fiveYearsFromNow: '',
    dayPlanning: '',
    taskTracking: '',
    unexpectedChanges: '',
    recentLearning: '',
    decisionMaking: '',
    explainingTasks: '',
    transcription: '',
  });

  // Randomly assign truth/lie to each field (memoized so it doesn't change on re-render)
  const fieldModes = useMemo(() => {
    const fields = Object.keys(formData) as (keyof FormData)[];
    const modes: Record<string, FieldMode> = {};
    
    fields.forEach(field => {
      modes[field] = Math.random() > 0.5 ? 'truth' : 'lie';
    });
    
    return modes;
  }, []);

  const { logKeyDown, logKeyUp, clearLogs, getLogs, getAnalytics, exportAsJSON, exportAsCSV } = useKeystrokeLogger();

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      email: '',
      age: '',
      occupation: '',
      morningRoutine: '',
      favoriteMemory: '',
      weekendActivity: '',
      calmExperience: '',
      stressfulSituation: '',
      idealHoliday: '',
      fiveYearsFromNow: '',
      dayPlanning: '',
      taskTracking: '',
      unexpectedChanges: '',
      recentLearning: '',
      decisionMaking: '',
      explainingTasks: '',
      transcription: '',
    });
    clearLogs();
    onClearData();
  };

  const renderShortInput = (label: string, field: keyof FormData) => (
    <ShortInputField
      label={label}
      value={formData[field]}
      onChange={handleInputChange(field)}
      onKeyDown={logKeyDown as any}
      onKeyUp={logKeyUp as any}
      mode={fieldModes[field]}
    />
  );

  const renderLongText = (label: string, field: keyof FormData, rows?: number) => (
    <LongTextArea
      label={label}
      value={formData[field]}
      onChange={handleInputChange(field)}
      onKeyDown={logKeyDown as any}
      onKeyUp={logKeyUp as any}
      mode={fieldModes[field]}
      rows={rows}
    />
  );

  return (
    <div>
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 rounded-lg border-2 border-yellow-300">
        <h3 className="font-semibold text-gray-800 mb-2">🎭 Lying Detection Test</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Fill out the form below following these rules:
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-green-100 border border-green-300 rounded font-semibold text-green-800">
              ✓ Green = Tell the TRUTH
            </span>
            <span className="px-3 py-1 bg-red-100 border border-red-300 rounded font-semibold text-red-800">
              ✗ Red = Tell a LIE
            </span>
          </div>
          <p className="text-xs text-gray-600 italic">
            The colors are randomly assigned. Switch between truth and lies as indicated by the field colors.
          </p>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto pr-2">
        <FormSection title="Personal Details">
          {renderShortInput("Full Name", "fullName")}
          {renderShortInput("Email Address", "email")}
          {renderShortInput("Age", "age")}
          {renderShortInput("Occupation", "occupation")}
        </FormSection>

        <FormSection title="Tell Us About Yourself">
          {renderLongText("Describe your typical morning routine", "morningRoutine")}
          {renderLongText("What's your favorite memory from the past year?", "favoriteMemory")}
          {renderLongText("How do you typically spend your weekends?", "weekendActivity")}
          {renderLongText("Describe a recent experience that you found calm or relaxing.", "calmExperience")}
          {renderLongText("Describe a recent situation where you felt stressed, pressured, or overwhelmed.", "stressfulSituation")}
          {renderLongText("What would be your ideal holiday?", "idealHoliday")}
          {renderLongText("Where do you see yourself 5 years from now?", "fiveYearsFromNow")}
          {renderLongText("Describe how you usually plan your day when you wake up.", "dayPlanning")}
          {renderLongText("Explain how you usually keep track of tasks, reminders, or deadlines.", "taskTracking")}
          {renderLongText("Describe how you typically respond when your plans change unexpectedly.", "unexpectedChanges")}
          {renderLongText("Describe something you learned recently that you found useful.", "recentLearning")}
          {renderLongText("Explain how you usually make decisions when choosing between options.", "decisionMaking")}
          {renderLongText("Describe how you would explain a simple task or process to someone unfamiliar with it.", "explainingTasks")}
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
          {renderLongText("Type the paragraph above exactly as shown:", "transcription", 6)}
        </FormSection>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onShowData}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {showData ? 'Hide Data' : 'Show All Data'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Clear Data
        </button>
      </div>

      {showData && (
        <KeystrokeDataDisplay 
          events={getLogs()}
          analytics={getAnalytics()}
          onExportJSON={exportAsJSON}
          onExportCSV={exportAsCSV}
        />
      )}
    </div>
  );
}