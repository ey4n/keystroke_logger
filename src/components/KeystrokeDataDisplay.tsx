
import React from 'react';
import { KeystrokeEvent } from '../types/keystroke';
import { KeystrokeAnalytics } from '../hooks/useKeystrokeLogger';

interface KeystrokeDataDisplayProps {
  events: KeystrokeEvent[];
  analytics?: KeystrokeAnalytics;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
}

export function KeystrokeDataDisplay({ 
  events, 
  analytics,
  onExportJSON,
  onExportCSV 
}: KeystrokeDataDisplayProps) {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
      {/* Header with Analytics */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Keystroke Data ({events.length} events)
          </h2>
          
          {/* Export Buttons */}
          {(onExportJSON || onExportCSV) && events.length > 0 && (
            <div className="flex gap-2">
              {onExportJSON && (
                <button
                  onClick={onExportJSON}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Export JSON
                </button>
              )}
              {onExportCSV && (
                <button
                  onClick={onExportCSV}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Export CSV
                </button>
              )}
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        {analytics && events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600">Total Events</div>
              <div className="text-lg font-semibold text-gray-800">
                {analytics.totalEvents}
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600">Duration</div>
              <div className="text-lg font-semibold text-gray-800">
                {(analytics.duration / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600">Avg Speed</div>
              <div className="text-lg font-semibold text-gray-800">
                {analytics.averageSpeed} KPM
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600">Unique Keys</div>
              <div className="text-lg font-semibold text-gray-800">
                {analytics.uniqueKeys}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
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
              {events.map((event, index) => (
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
  );
}