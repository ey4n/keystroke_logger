import React, { useState } from 'react';
import { KeystrokeEvent } from '../types/keystroke';
import { KeystrokeAnalytics } from '../hooks/useKeystrokeLogger';
import { saveKeystrokesNoAuth } from '../services/saveKeystrokes';
import { StressWorkloadForm, StressWorkloadData } from './StressWorkloadForm';
import { saveStressWorkload } from '../services/saveStressWorkload';
import { saveLeaderboardEntry } from '../services/saveLeaderboard';
import { Leaderboard } from './Leaderboard';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showStressForm, setShowStressForm] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  async function handleSaveToSupabase() {
    if (events.length === 0) {
      alert('No keystroke data to save!');
      return;
    }

    // Show stress form first
    setShowStressForm(true);
  }

  async function handleStressFormSubmit(stressData: StressWorkloadData) {
    setShowStressForm(false);
    
    try {
      setIsSaving(true);
      setSaveStatus('idle');

      // Map events to match the database schema and saveKeystrokes function
      const enrichedEvents = events.map((ev) => ({
        key: ev.key,
        eventType: ev.eventType,
        pressed_at: ev.timestamp,
        timestamp: ev.timestamp,
        code: ev.code,
        sessionId: sessionId || ev.sessionId, // Use sessionId from props first
        testType: testType, 
        deviceInfo: ev.deviceInfo,
        fieldName: ev.fieldName,
        elapsedSinceStart: ev.elapsedSinceStart,
        challengeId: ev.challengeId,
        formSnapshot: formData
      }));

      console.log(`Saving ${enrichedEvents.length} keystroke events for session ${sessionId}...`);
      
      // Save keystroke data
      const keystrokeRes = await saveKeystrokesNoAuth(enrichedEvents);
      console.log(`✅ Successfully saved ${keystrokeRes.count} keystroke events!`);

      // Save stress/workload data
      await saveStressWorkload(sessionId || '', testType, stressData);
      console.log(`✅ Successfully saved stress/workload data!`);

      // Save leaderboard entry for timed and multitasking tests
      if ((testType === 'timed' || testType === 'multitasking') && formData) {
        try {
          const userName = formData.formSnapshot?.fullName || formData.fullName || 'Anonymous';
          
          if (testType === 'timed') {
            const timeTaken = formData.timeElapsed || 0; // Time in seconds
            await saveLeaderboardEntry({
              userName,
              testType: 'timed',
              timeTaken,
              sessionId: sessionId || '',
            });
            console.log(`✅ Saved leaderboard entry for timed test: ${timeTaken}s`);
          } else if (testType === 'multitasking') {
            const score = formData.score || 0;
            await saveLeaderboardEntry({
              userName,
              testType: 'multitasking',
              score,
              sessionId: sessionId || '',
            });
            console.log(`✅ Saved leaderboard entry for multitasking test: ${score} points`);
          }
        } catch (leaderboardError) {
          console.error('Error saving leaderboard entry:', leaderboardError);
          // Don't fail the whole save if leaderboard fails
        }
      }

      setSaveStatus('success');
      
      // Show leaderboard for timed and multitasking tests
      if (testType === 'timed' || testType === 'multitasking') {
        setShowLeaderboard(true);
        // Scroll to leaderboard
        setTimeout(() => {
          const leaderboardElement = document.querySelector('[data-leaderboard]');
          if (leaderboardElement) {
            leaderboardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        alert(`✅ Saved ${keystrokeRes.count} keystrokes and stress/workload data to Supabase`);
      }
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error saving data:', err);
      setSaveStatus('error');
      alert(`❌ Save failed: ${err?.message ?? err}`);
    } finally {
      setIsSaving(false);
    }
  }


  // Extract user data for leaderboard
  const userName = formData?.formSnapshot?.fullName || formData?.fullName;
  const currentScore = formData?.score;
  const currentTime = formData?.timeElapsed;

  return (
    <>
      {/* Stress/Workload Form Modal */}
      {showStressForm && (
        <StressWorkloadForm
          onSubmit={handleStressFormSubmit}
          onCancel={() => setShowStressForm(false)}
        />
      )}

      {/* Leaderboard - shown after successful save for timed/multitasking tests */}
      {showLeaderboard && (testType === 'timed' || testType === 'multitasking') && (
        <div data-leaderboard>
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">
                ✅ Successfully saved! Check out the leaderboard below to see how you rank!
              </p>
            </div>
          </div>
          <Leaderboard
            testType={testType as 'timed' | 'multitasking'}
            currentUserName={userName}
            currentScore={currentScore}
            currentTime={currentTime}
            sessionId={sessionId}
          />
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
        {/* ===== HEADER ===== */}
        <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Keystroke Data ({events.length} events)
          </h2>

          {/* Action Buttons */}
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToSupabase}
                disabled={isSaving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSaving ? 'Saving…' : '💾 Save to Supabase'}
              </button>
              
              {saveStatus === 'success' && (
                <span className="text-green-600 font-medium text-sm">
                  ✓ Saved!
                </span>
              )}
              
              {saveStatus === 'error' && (
                <span className="text-red-600 font-medium text-sm">
                  ✗ Failed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="mb-3 p-2 bg-indigo-50 rounded border border-indigo-200">
            <span className="text-xs text-gray-600">Session ID: </span>
            <span className="font-mono text-xs font-semibold text-indigo-600">
              {sessionId}
            </span>
            <span className="text-xs text-gray-600 ml-3">Test Type: </span>
            <span className="font-semibold text-xs text-gray-800">{testType}</span>
          </div>
        )}

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
    </>
  );
}