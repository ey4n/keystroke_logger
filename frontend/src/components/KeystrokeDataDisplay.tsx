import React, { useState } from 'react';
import { KeystrokeEvent } from '../types/keystroke';
import { KeystrokeAnalytics } from '../hooks/useKeystrokeLogger';
import { saveKeystrokesNoAuth } from '../services/saveKeystrokes';

interface KeystrokeDataDisplayProps {
  events: KeystrokeEvent[];
  analytics?: KeystrokeAnalytics;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  testType?: string;
  sessionId?: string;
  formData?: Record<string, any>;
}

export function KeystrokeDataDisplay({
  events,
  analytics,
  onExportJSON,
  onExportCSV,
  testType = 'unknown',
  sessionId,
  formData,
}: KeystrokeDataDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveToSupabase() {
    try {
      setIsSaving(true);

      const shaped = events.map((ev: any) => ({
        key: ev.key ?? ev.code ?? 'Unknown',
        pressed_at: ev.timestamp ?? ev.time ?? ev.pressedAt ?? new Date().toISOString(),
        latency_ms: ev.latencyMs ?? ev.latency ?? null,
        meta: {
          type: ev.eventType ?? ev.type,
          field: ev.fieldName,
          challengeId: ev.challengeId,
          sessionId: sessionId ?? ev.sessionId,
          elapsedSinceStart: ev.elapsedSinceStart,
          deviceInfo: ev.deviceInfo,
          formSnapshot: formData ?? {},
        }
      }));

      const res = await saveKeystrokesNoAuth(shaped, testType);

      alert(`✅ Saved ${res.count} keystrokes to Supabase`);
    } catch (err: any) {
      console.error(err);
      alert(`❌ Save failed: ${err?.message ?? err}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
      {/* ===== HEADER ===== */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Keystroke Data ({events.length} events)
          </h2>

          {/* Action Buttons */}
          {events.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveToSupabase}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {isSaving ? 'Saving…' : '💾 Save to Supabase'}
              </button>
            </div>
          )}
        </div>

        {/* ===== ANALYTICS SUMMARY ===== */}
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

      {/* ===== DATA TABLE ===== */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 italic">No data captured yet. Start typing!</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="p-2 text-left font-semibold">#</th>
                <th className="p-2 text-left font-semibold">Event</th>
                <th className="p-2 text-left font-semibold">Key</th>
                <th className="p-2 text-left font-semibold">Code</th>
                <th className="p-2 text-left font-semibold">Field</th>
                <th className="p-2 text-left font-semibold">Challenge</th>
                <th className="p-2 text-left font-semibold">Session</th>
                <th className="p-2 text-left font-semibold">Elapsed (ms)</th>
                <th className="p-2 text-left font-semibold">Timestamp</th>
                <th className="p-2 text-left font-semibold">Device Info</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">
                    <span
                      className={
                        e.eventType === 'keydown'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }
                    >
                      {e.eventType}
                    </span>
                  </td>
                  <td className="p-2 font-mono">{e.key}</td>
                  <td className="p-2 font-mono text-xs">{e.code}</td>
                  <td className="p-2 text-xs text-gray-700">
                    {e.fieldName ?? '-'}
                  </td>
                  <td className="p-2 text-xs text-gray-700">
                    {e.challengeId ?? '-'}
                  </td>
                  <td className="p-2 text-xs text-gray-700">
                    {e.sessionId ? e.sessionId.slice(-6) : '-'}
                  </td>
                  <td className="p-2 text-xs text-gray-700">
                    {e.elapsedSinceStart ?? '-'}
                  </td>
                  <td className="p-2 font-mono text-xs">{e.timestamp}</td>
                  <td className="p-2 text-[10px] text-gray-600 truncate max-w-[180px]">
                    {e.deviceInfo ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}