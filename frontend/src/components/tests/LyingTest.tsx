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
  
  return (
    <div>
      <label className={`block text-sm font-medium mb-1 ${isTruth ? 'text-green-700' : 'text-red-700'}`}>
        {label} {isTruth ? '✓ (Tell Truth)' : '✗ (Tell Lie)'}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
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
  mode
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  mode: FieldMode;
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
        rows={3}
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

  const renderLongText = (label: string, field: keyof FormData) => (
    <LongTextArea
      label={label}
      value={formData[field]}
      onChange={handleInputChange(field)}
      onKeyDown={logKeyDown as any}
      onKeyUp={logKeyUp as any}
      mode={fieldModes[field]}
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