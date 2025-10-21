// components/tests/TimedTest.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';
import { DEFAULT_TIMED_PARAGRAPH, DEFAULT_TIME_LIMIT } from '../../data/testParagraphs';

interface TimedTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
  targetParagraph?: string;
  timeLimit?: number;
}

export function TimedTest({ 
  onShowData, 
  onClearData, 
  showData,
  targetParagraph = DEFAULT_TIMED_PARAGRAPH,
  timeLimit = DEFAULT_TIME_LIMIT
}: TimedTestProps) {
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { 
    logKeyDown, 
    logKeyUp, 
    clearLogs, 
    getLogs, 
    getAnalytics,
    exportAsJSON,
    exportAsCSV 
  } = useKeystrokeLogger();
  
  const timerRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (timerExpired || isCompleted) return;
    
    const newText = e.target.value;
    setText(newText);
    
    // Start timer on first keystroke
    if (!isTimerActive && text.length === 0) {
      setIsTimerActive(true);
    }
    
    // Check if user completed the paragraph
    if (newText === targetParagraph) {
      setIsCompleted(true);
      setIsTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleClear = () => {
    setText('');
    setIsTimerActive(false);
    setTimerExpired(false);
    setIsCompleted(false);
    setTimeLeft(timeLimit);
    clearLogs();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onClearData();
  };

  return (
    <div>
      {/* Timer Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        isCompleted ? 'bg-green-50 border-green-300' : 
        timerExpired ? 'bg-red-50 border-red-300' : 
        isTimerActive ? 'bg-orange-50 border-orange-300' : 
        'bg-blue-50 border-blue-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              {isCompleted ? '✅ Completed!' : 
               timerExpired ? '⏰ Time\'s Up!' : 
               isTimerActive ? '⏱️ Timer Running' : 
               '⏱️ Timer Ready'}
            </h3>
            <p className="text-sm text-gray-600">
              {isCompleted ? 'Great job! You finished in time.' : 
               timerExpired ? 'You ran out of time!' : 
               isTimerActive ? 'Type quickly!' : 
               'Start typing to begin'}
            </p>
          </div>
          <div className={`text-4xl font-bold ${
            isCompleted ? 'text-green-600' : 
            timerExpired ? 'text-red-600' : 
            timeLeft <= 10 ? 'text-red-600' : 
            timeLeft <= 30 ? 'text-orange-600' : 
            'text-blue-600'
          }`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Target Paragraph */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-2">Type this paragraph:</h3>
        <p className="font-mono text-sm text-gray-700 leading-relaxed">
          {targetParagraph}
        </p>
        <div className="mt-2 text-xs text-gray-600">
          Progress: {text.length} / {targetParagraph.length} characters
        </div>
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
          Type here:
        </label>
        <textarea
          id="textInput"
          value={text}
          onChange={handleChange}
          onKeyDown={logKeyDown}
          onKeyUp={logKeyUp}
          disabled={timerExpired || isCompleted}
          className={`w-full h-48 p-4 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none font-mono ${
            (timerExpired || isCompleted) ? 'bg-gray-100 border-red-300 cursor-not-allowed' : 'border-gray-300'
          }`}
          placeholder={
            timerExpired ? "Time expired! Clear data to try again..." :
            isCompleted ? "Completed! Clear data to try again..." :
            "Start typing the paragraph above..."
          }
        />
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
      </div>

      {/* Keystroke Data Display */}
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