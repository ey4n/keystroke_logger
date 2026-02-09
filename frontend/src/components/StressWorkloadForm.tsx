'use client';

import React, { useState } from 'react';

export interface StressWorkloadData {
  stressLevel: number;
  mentalDemand: number;
  rushedFeeling: number;
  concentrationDifficulty: number;
  moreStressedThanBaseline: 'Yes' | 'No' | 'Unsure';
  discomfortOrDistraction?: string;
}

interface StressWorkloadFormProps {
  onSubmit: (data: StressWorkloadData) => void;
  onCancel?: () => void;
  /** When 'standalone', full-page gray + centered card (like Baseline). When 'modal', overlay + card. */
  variant?: 'modal' | 'standalone';
}

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1.25rem',
};

export function StressWorkloadForm({ onSubmit, onCancel, variant = 'modal' }: StressWorkloadFormProps) {
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [mentalDemand, setMentalDemand] = useState<number | null>(null);
  const [rushedFeeling, setRushedFeeling] = useState<number | null>(null);
  const [concentrationDifficulty, setConcentrationDifficulty] = useState<number | null>(null);
  const [moreStressedThanBaseline, setMoreStressedThanBaseline] = useState<'Yes' | 'No' | 'Unsure'>('Unsure');
  const [discomfortOrDistraction, setDiscomfortOrDistraction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stressLevel === null || mentalDemand === null || rushedFeeling === null || concentrationDifficulty === null) {
      alert('Please rate all questions before submitting.');
      return;
    }
    onSubmit({
      stressLevel,
      mentalDemand,
      rushedFeeling,
      concentrationDifficulty,
      moreStressedThanBaseline,
      discomfortOrDistraction: discomfortOrDistraction.trim() || undefined,
    });
  };

  // Same scale style as Baseline: grid of 10, rounded-lg, purple when selected, gray when not
  const RatingScale = ({
    label,
    value,
    onChange,
    leftLabel = '1 (Not at all)',
    rightLabel = '10 (Extremely)',
  }: {
    label: string;
    value: number | null;
    onChange: (value: number) => void;
    leftLabel?: string;
    rightLabel?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="grid grid-cols-10 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square min-h-[44px] w-full rounded-lg font-semibold text-base transition-all duration-200 ${
              value === n
                ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300 ring-offset-2'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-1 mt-2">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

  const card = (
    <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="pt-8 pb-2 px-6">
        <h1 className="text-2xl font-bold text-gray-900">Post-Task Stress & Workload</h1>
        <p className="text-gray-500 text-sm mt-1">A few quick questions about your experience during the task</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
        <RatingScale
          label="How stressed did you feel during the previous task? *"
          value={stressLevel}
          onChange={setStressLevel}
          leftLabel="1 (Not at all stressed)"
          rightLabel="10 (Extremely stressed)"
        />
        <RatingScale
          label="How mentally demanding was the task? *"
          value={mentalDemand}
          onChange={setMentalDemand}
        />
        <RatingScale
          label="How rushed did you feel? *"
          value={rushedFeeling}
          onChange={setRushedFeeling}
        />
        <RatingScale
          label="How difficult was it to concentrate? *"
          value={concentrationDifficulty}
          onChange={setConcentrationDifficulty}
        />

        {/* Optional – same uppercase label style as Baseline */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            More stressed than at baseline?
          </label>
          <select
            value={moreStressedThanBaseline}
            onChange={(e) => setMoreStressedThanBaseline(e.target.value as 'Yes' | 'No' | 'Unsure')}
            className="w-full min-h-[48px] pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
            style={selectStyle}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unsure">Unsure</option>
          </select>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Any discomfort or distraction? (optional)
          </label>
          <input
            type="text"
            value={discomfortOrDistraction}
            onChange={(e) => setDiscomfortOrDistraction(e.target.value)}
            placeholder="e.g. noise, fatigue"
            className="w-full min-h-[48px] px-4 py-2.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
        </div>

        {onCancel && variant === 'modal' && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="w-full py-4 px-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          Submit & Continue
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          End-to-end encrypted research data.
        </p>
      </form>
    </div>
  );

  if (variant === 'standalone') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {card}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-h-[90vh] overflow-y-auto w-full flex items-center justify-center">
        {card}
      </div>
    </div>
  );
}
