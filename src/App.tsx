import React, { useState, useRef } from 'react';

interface KeystrokeEvent {
  key: string;
  eventType: 'keydown' | 'keyup';
  timestamp: number;
  code: string;
}

export default function KeystrokeLogger() {
  const [text, setText] = useState('');
  const [showData, setShowData] = useState(false);
  const keystrokeData = useRef<KeystrokeEvent[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keydown',
      timestamp: Date.now(),
      code: e.code,
    };
    keystrokeData.current.push(event);
    console.log('KeyDown:', event);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keyup',
      timestamp: Date.now(),
      code: e.code,
    };
    keystrokeData.current.push(event);
    console.log('KeyUp:', event);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const clearData = () => {
    keystrokeData.current = [];
    setText('');
    setShowData(false);
    console.log('Data cleared');
  };

  const toggleShowData = () => {
    setShowData(!showData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Keystroke Dynamics Logger
          </h1>
          <p className="text-gray-600 mb-6">
            Type in the text box below. Keystroke events will be logged to the console.
          </p>

          <div className="mb-6">
            <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
              Type here:
            </label>
            <textarea
              id="textInput"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none font-mono"
              placeholder="Start typing to capture keystroke data..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleShowData}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {showData ? 'Hide Data' : 'Show All Data'}
            </button>
            <button
              onClick={clearData}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Clear Data
            </button>
          </div>

          {showData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Keystroke Data ({keystrokeData.current.length} events)
              </h2>
              <div className="max-h-96 overflow-y-auto">
                {keystrokeData.current.length === 0 ? (
                  <p className="text-gray-500 italic">No data captured yet. Start typing!</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-semibold">#</th>
                        <th className="text-left p-2 font-semibold">Event</th>
                        <th className="text-left p-2 font-semibold">Key</th>
                        <th className="text-left p-2 font-semibold">Code</th>
                        <th className="text-left p-2 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keystrokeData.current.map((event, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <span className={event.eventType === 'keydown' ? 'text-green-600' : 'text-blue-600'}>
                              {event.eventType}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{event.key}</td>
                          <td className="p-2 font-mono text-xs">{event.code}</td>
                          <td className="p-2 font-mono text-xs">{event.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}