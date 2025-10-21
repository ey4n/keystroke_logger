import React, { useState } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';

interface FreeTypingTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

export function Free({ onShowData, onClearData, showData }: FreeTypingTestProps) {
  const [text, setText] = useState('');
  const { logKeyDown, logKeyUp, clearLogs, getLogs, getLogCount, getAnalytics, exportAsJSON, exportAsCSV } = useKeystrokeLogger();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleClear = () => {
    setText('');
    clearLogs();
    onClearData();
  };

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
          Type freely:
        </label>
        <textarea
          id="textInput"
          value={text}
          onChange={handleChange}
          onKeyDown={logKeyDown}
          onKeyUp={logKeyUp}
          className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none font-mono"
          placeholder="Start typing to capture keystroke data..."
        />
      </div>

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