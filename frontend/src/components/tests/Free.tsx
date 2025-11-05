// components/tests/FreeTypingTest.tsx
import React, { useState, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';
import { saveKeystrokesNoAuth } from '../../services/saveKeystrokes';

interface FreeTypingTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

interface FormData {
  // Personal Details
  fullName: string;
  email: string;
  age: string;
  occupation: string;
  
  // Longer Answer Questions
  morningRoutine: string;
  favoriteMemory: string;
  weekendActivity: string;
}

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
  onKeyUp
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
    />
  </div>
);

const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      rows={3}
      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
    />
  </div>
);


export function Free({ onShowData, onClearData, showData }: FreeTypingTestProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    age: '',
    occupation: '',
    morningRoutine: '',
    favoriteMemory: '',
    weekendActivity: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const id = (globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`);
    setSessionId(id);
  }, []);

  const {
    logKeyDown,
    logKeyUp,
    clearLogs,
    getLogs,
    getAnalytics,
    exportAsJSON,
    exportAsCSV
  } = useKeystrokeLogger();

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  async function handleSaveToSupabase() {
    try {
      setIsSaving(true);

      const events = getLogs(); 

      const shaped = events.map((ev: any) => ({
        key: ev.key ?? ev.code ?? 'Unknown',
        pressed_at: ev.timestamp ?? ev.time ?? ev.pressedAt ?? new Date().toISOString(),
        latency_ms: ev.latencyMs ?? ev.latency ?? null,
        meta: {
          type: ev.type,            // e.g., 'keydown' / 'keyup'
          field: ev.fieldName,  
          sessionId,
          formSnapshot: {
            fullName: formData.fullName,
            email: formData.email,
          }
        }
      }));

      const res = await saveKeystrokesNoAuth(shaped, 'free-form');

      alert(`Saved ${res.count} keystrokes to Supabase ✅`);
    } catch (err: any) {
      console.error(err);
      alert(`Save failed: ${err?.message ?? err}`);
    } finally {
      setIsSaving(false);
    }
  }

  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

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
      <div className="max-h-[500px] overflow-y-auto pr-2 mb-6">
        <FormSection title="Personal Details">
          <ShortInputField
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
          <ShortInputField
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange('email')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
          <ShortInputField
            label="Age"
            value={formData.age}
            onChange={handleInputChange('age')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
          <ShortInputField
            label="Occupation"
            value={formData.occupation}
            onChange={handleInputChange('occupation')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
        </FormSection>

        <FormSection title="Tell Us About Yourself">
          <LongTextArea
            label="Describe your typical morning routine"
            value={formData.morningRoutine}
            onChange={handleInputChange('morningRoutine')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
          <LongTextArea
            label="What's your favorite memory from the past year?"
            value={formData.favoriteMemory}
            onChange={handleInputChange('favoriteMemory')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
          <LongTextArea
            label="How do you typically spend your weekends?"
            value={formData.weekendActivity}
            onChange={handleInputChange('weekendActivity')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
          />
        </FormSection>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
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

        <button
          onClick={handleSaveToSupabase}
          disabled={isSaving || !sessionId}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save to Supabase'}
        </button>
      </div>

      {/* Data viewer */}
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
