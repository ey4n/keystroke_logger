import React, { useState } from 'react';
import { KeystrokeEvent } from '../types/keystroke';
import { KeystrokeAnalytics } from '../hooks/useKeystrokeLogger';
import { saveKeystrokesNoAuth } from '../services/saveKeystrokes';
import { StressWorkloadForm, StressWorkloadData } from './StressWorkloadForm';
import { saveStressWorkload } from '../services/saveStressWorkload';
import { saveLeaderboardEntry } from '../services/saveLeaderboard';
import { Leaderboard } from './Leaderboard';
import { getTranscriptionPenaltyDetails, getTranscriptionErrorExplanation } from '../utils/transcriptionValidation';

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
  const [dataDeepDiveView, setDataDeepDiveView] = useState<'summary' | 'advanced'>('summary');

  async function handleSaveToSupabase() {
    if (events.length === 0) {
      alert('No keystroke data to save!');
      return;
    }

    // Stop challenges for multitasking test
    if (testType === 'multitasking') {
      window.dispatchEvent(new CustomEvent('multitasking-test-save-clicked'));
    }
    // Stop timer and popups for timed test
    if (testType === 'timed') {
      window.dispatchEvent(new CustomEvent('timed-test-save-clicked'));
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

      // Validate transcription and calculate penalty (use the paragraph that was actually shown)
      const transcriptionText = formData?.formSnapshot?.transcription || formData?.transcription || '';
      const transcriptionReference = formData?.questionSet?.transcription?.[0]?.paragraph;
      const { errorCount: transcriptionErrorCount, penalty: transcriptionPenalty } = getTranscriptionPenaltyDetails(
        transcriptionText,
        transcriptionReference
      );
      
      if (transcriptionPenalty > 0) {
        console.log(`⚠️ Transcription validation: ${transcriptionErrorCount} error(s), ${transcriptionPenalty} points deducted.`);
      } else {
        console.log(`✅ Transcription validation passed!`);
      }

      // Save leaderboard entry for timed and multitasking tests
      if ((testType === 'timed' || testType === 'multitasking') && formData) {
        try {
          const userName = formData.formSnapshot?.fullName || formData.fullName || 'Anonymous';
          
          if (testType === 'timed') {
            // For timed test, apply transcription penalty to score
            const baseScore = formData.score !== undefined ? formData.score : 0;
            const finalScore = Math.max(0, baseScore - transcriptionPenalty);
            const timeTaken = formData.timeElapsed || 0; // Time in seconds
            
            await saveLeaderboardEntry({
              userName,
              testType: 'timed',
              score: finalScore,
              timeTaken,
              sessionId: sessionId || '',
            });
            console.log(`✅ Saved leaderboard entry for timed test: ${finalScore} pts, ${timeTaken}s (score: ${finalScore} after transcription penalty)`);
          } else if (testType === 'multitasking') {
            // For multitasking test, apply transcription penalty to score
            const baseScore = formData.score !== undefined ? formData.score : 0;
            const finalScore = Math.max(0, baseScore - transcriptionPenalty);
            console.log(`Base score: ${baseScore}, Transcription penalty: ${transcriptionPenalty}, Final score: ${finalScore}`);
            
            await saveLeaderboardEntry({
              userName,
              testType: 'multitasking',
              score: finalScore,
              sessionId: sessionId || '',
            });
            console.log(`✅ Saved leaderboard entry for multitasking test: ${finalScore} points (${baseScore} - ${transcriptionPenalty} transcription penalty)`);
          }
        } catch (leaderboardError) {
          console.error('Error saving leaderboard entry:', leaderboardError);
          // Don't fail the whole save if leaderboard fails
        }
      }

      setSaveStatus('success');
      
      // Show transcription validation result
      let saveMessage = `✅ Saved ${keystrokeRes.count} keystrokes and stress/workload data to Supabase`;
      if (transcriptionPenalty > 0) {
        const transcriptionWhy = getTranscriptionErrorExplanation(transcriptionText, transcriptionReference);
        saveMessage += `\n⚠️ Transcription validation: ${transcriptionErrorCount} error(s), ${transcriptionPenalty} point(s) deducted.`;
        if (transcriptionWhy) saveMessage += `\n\nWhy: ${transcriptionWhy}`;
      } else if (transcriptionText.trim() !== '') {
        saveMessage += `\n✅ Transcription validation: Perfect! No errors found.`;
      }
      
      // Show results view for timed, multitasking, and free tests
      if (testType === 'timed' || testType === 'multitasking' || testType === 'free') {
        setShowLeaderboard(true);
        if (transcriptionPenalty > 0 && (testType === 'timed' || testType === 'multitasking')) {
          alert(saveMessage);
        }
        setTimeout(() => {
          const resultsEl = document.querySelector('[data-leaderboard]');
          if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        alert(saveMessage);
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
  let currentScore = formData?.score;
  const currentTime = formData?.timeElapsed;
  
  // Calculate transcription validation for leaderboard display (use the paragraph that was shown)
  const transcriptionText = formData?.formSnapshot?.transcription || formData?.transcription || '';
  const transcriptionReference = formData?.questionSet?.transcription?.[0]?.paragraph;
  const { errorCount: transcriptionErrorCount, penalty: transcriptionPenalty } = getTranscriptionPenaltyDetails(
    transcriptionText,
    transcriptionReference
  );
  const transcriptionErrorExplanation = getTranscriptionErrorExplanation(transcriptionText, transcriptionReference);
  const hasTranscriptionError = transcriptionPenalty > 0;
  
  // Apply transcription penalty to current score for display
  if ((testType === 'timed' || testType === 'multitasking') && currentScore !== undefined) {
    currentScore = Math.max(0, currentScore - transcriptionPenalty);
  }

  return (
    <>
      {/* Stress/Workload Form Modal */}
      {showStressForm && (
        <StressWorkloadForm
          onSubmit={handleStressFormSubmit}
          onCancel={() => setShowStressForm(false)}
        />
      )}

      {/* Results - shown after successful save for timed, multitasking, and free tests */}
      {showLeaderboard && (testType === 'timed' || testType === 'multitasking' || testType === 'free') && (
        <div data-leaderboard className="space-y-6">
          {/* Success banner */}
          <div className="p-5 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Successfully Saved!</p>
                <p className="text-sm text-green-800 mt-0.5">
                  Your performance data has been synchronized with the research database.
                </p>
                {hasTranscriptionError && (testType === 'timed' || testType === 'multitasking') && (
                  <p className="text-sm text-amber-700 mt-2">
                    Note: Transcription had {transcriptionErrorCount} error(s); {transcriptionPenalty} point(s) deducted from score.
                    {transcriptionErrorExplanation && ` ${transcriptionErrorExplanation}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard only for timed and multitasking */}
          {(testType === 'timed' || testType === 'multitasking') && (
            <Leaderboard
              testType={testType as 'timed' | 'multitasking'}
              currentUserName={userName}
              currentScore={currentScore}
              currentTime={currentTime}
              sessionId={sessionId}
            />
          )}

          {/* Data Deep Dive: Total events, Avg speed, Test duration + optional table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data deep dive</h3>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setDataDeepDiveView('summary')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    dataDeepDiveView === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setDataDeepDiveView('advanced')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    dataDeepDiveView === 'advanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>
            <div className="p-6">
              {analytics && events.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total events</div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</div>
                    <div className="mt-2 h-1 w-16 rounded-full bg-purple-200 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (analytics.totalEvents / 200) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Avg speed</div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.averageSpeed} KPM</div>
                    <div className="mt-2 h-1 w-16 rounded-full bg-blue-200 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (analytics.averageSpeed / 150) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Test duration</div>
                    <div className="text-2xl font-bold text-gray-900">{(analytics.duration / 1000).toFixed(1)}s</div>
                    <div className="mt-2 h-1 w-full rounded-full bg-purple-200 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              )}
              {dataDeepDiveView === 'advanced' && (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left font-semibold text-gray-700">#</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Event</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Key</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Code</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Field</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Elapsed (ms)</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Timestamp</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Device Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <span className={e.eventType === 'keydown' ? 'text-green-600' : 'text-blue-600'}>
                              {e.eventType}
                            </span>
                          </td>
                          <td className="p-2 font-mono">{e.key}</td>
                          <td className="p-2 font-mono text-xs">{e.code}</td>
                          <td className="p-2 text-xs text-gray-600">{e.fieldName ?? '-'}</td>
                          <td className="p-2 text-xs text-gray-600">{e.elapsedSinceStart ?? '-'}</td>
                          <td className="p-2 font-mono text-xs">{e.timestamp}</td>
                          <td className="p-2 text-[10px] text-gray-500 truncate max-w-[160px]">{e.deviceInfo ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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

        {/* ===== ANALYTICS SUMMARY (only when not in post-save results view) ===== */}
        {!(showLeaderboard && (testType === 'timed' || testType === 'multitasking' || testType === 'free')) && analytics && events.length > 0 && (
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

        {/* ===== DATA TABLE (only when not in post-save results view; table is in Data Deep Dive > Advanced for timed/multitasking/free) ===== */}
        {!(showLeaderboard && (testType === 'timed' || testType === 'multitasking' || testType === 'free')) && (
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
        )}
      </div>
    </>
  );
}