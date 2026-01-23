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
  const [stressLevel, setStressLevel] = useState(50);
  const [mentalDemand, setMentalDemand] = useState(50);
  const [rushedFeeling, setRushedFeeling] = useState(50);
  const [concentrationDifficulty, setConcentrationDifficulty] = useState(50);
  const [moreStressedThanBaseline, setMoreStressedThanBaseline] = useState<'Yes' | 'No' | 'Unsure'>('Unsure');
  const [discomfortOrDistraction, setDiscomfortOrDistraction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      stressLevel,
      mentalDemand,
      rushedFeeling,
      concentrationDifficulty,
      moreStressedThanBaseline,
      discomfortOrDistraction: discomfortOrDistraction.trim() || undefined,
    });
  };

  const SliderField = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-indigo-600">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0 (Not at all)</span>
        <span>100 (Extremely)</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Post-Task Stress & Workload Self-Report
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Please rate your experience during the previous task using the sliders below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stress Level */}
            <SliderField
              label="How stressed did you feel during the previous task? (0–100)"
              value={stressLevel}
              onChange={setStressLevel}
            />

            {/* Mental Demand */}
            <SliderField
              label="How mentally demanding was the task? (0–100)"
              value={mentalDemand}
              onChange={setMentalDemand}
            />

            {/* Rushed Feeling */}
            <SliderField
              label="How rushed did you feel? (0–100)"
              value={rushedFeeling}
              onChange={setRushedFeeling}
            />

            {/* Concentration Difficulty */}
            <SliderField
              label="How difficult was it to concentrate? (0–100)"
              value={concentrationDifficulty}
              onChange={setConcentrationDifficulty}
            />

            {/* More Stressed Than Baseline */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Did you feel more stressed than during the baseline typing tasks?
              </label>
              <div className="flex gap-4">
                {(['Yes', 'No', 'Unsure'] as const).map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moreStressedThanBaseline"
                      value={option}
                      checked={moreStressedThanBaseline === option}
                      onChange={() => setMoreStressedThanBaseline(option)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Free Text */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Did anything about the tasks make you feel uncomfortable or distracted?
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={discomfortOrDistraction}
                onChange={(e) => setDiscomfortOrDistraction(e.target.value)}
                placeholder="Please share any thoughts or concerns..."
                rows={4}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:border-indigo-500 focus:ring-indigo-200 outline-none transition-all resize-none"
              />
            </div>

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
