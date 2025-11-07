'use client';

import React, { useState, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';
import { saveKeystrokesNoAuth } from '../../services/saveKeystrokes';
import { FormData, initialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';

interface FreeTypingTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

export function Free({ onShowData, onClearData, showData }: FreeTypingTestProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
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
    setFormData(initialFormData);
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
          type: ev.type,
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
      <DataCollectionForm
        formData={formData}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        className="max-h-[500px] overflow-y-auto pr-2 mb-6"
      />

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