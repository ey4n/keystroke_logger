'use client';

import React, { useState } from 'react';

export interface StressWorkloadData {
  stressLevel: number; // 0-100
  mentalDemand: number; // 0-100
  rushedFeeling: number; // 0-100
  concentrationDifficulty: number; // 0-100
  moreStressedThanBaseline: 'Yes' | 'No' | 'Unsure';
  discomfortOrDistraction?: string; // optional free text
}

interface StressWorkloadFormProps {
  onSubmit: (data: StressWorkloadData) => void;
  onCancel?: () => void;
}

export function StressWorkloadForm({ onSubmit, onCancel }: StressWorkloadFormProps) {
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [mentalDemand, setMentalDemand] = useState<number | null>(null);
  const [rushedFeeling, setRushedFeeling] = useState<number | null>(null);
  const [concentrationDifficulty, setConcentrationDifficulty] = useState<number | null>(null);
  const [moreStressedThanBaseline, setMoreStressedThanBaseline] = useState<'Yes' | 'No' | 'Unsure'>('Unsure');
  const [discomfortOrDistraction, setDiscomfortOrDistraction] = useState('');

  // Convert 1-10 scale to 0-100 for database (rounded to integer)
  const scaleTo100 = (value: number): number => {
    // Map 1 -> 0, 10 -> 100, then round to integer
    return Math.round(((value - 1) / 9) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are selected
    if (stressLevel === null || mentalDemand === null || rushedFeeling === null || concentrationDifficulty === null) {
      alert('Please rate all questions before submitting.');
      return;
    }

    onSubmit({
      stressLevel: scaleTo100(stressLevel),
      mentalDemand: scaleTo100(mentalDemand),
      rushedFeeling: scaleTo100(rushedFeeling),
      concentrationDifficulty: scaleTo100(concentrationDifficulty),
      moreStressedThanBaseline,
      discomfortOrDistraction: discomfortOrDistraction.trim() || undefined,
    });
  };

  const RatingScale = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number | null; 
    onChange: (value: number) => void;
  }) => {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`
                flex-1 py-3 px-2 rounded-lg font-semibold text-sm
                transition-all duration-200 transform hover:scale-105 active:scale-95
                ${value === rating
                  ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                }
              `}
            >
              {rating}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>1 (Not at all)</span>
          <span>10 (Extremely)</span>
        </div>
        {value !== null && (
          <div className="text-center">
            <span className="text-sm font-semibold text-indigo-600">Selected: {value}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Post-Task Stress & Workload Self-Report
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Please rate your experience during the previous task using the scale below (1-10).
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stress Level */}
            <RatingScale
              label="How stressed did you feel during the previous task?"
              value={stressLevel}
              onChange={setStressLevel}
            />

            {/* Mental Demand */}
            <RatingScale
              label="How mentally demanding was the task?"
              value={mentalDemand}
              onChange={setMentalDemand}
            />

            {/* Rushed Feeling */}
            <RatingScale
              label="How rushed did you feel?"
              value={rushedFeeling}
              onChange={setRushedFeeling}
            />

            {/* Concentration Difficulty */}
            <RatingScale
              label="How difficult was it to concentrate?"
              value={concentrationDifficulty}
              onChange={setConcentrationDifficulty}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Submit & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
