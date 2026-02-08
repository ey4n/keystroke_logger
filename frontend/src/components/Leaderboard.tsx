'use client';

import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/saveLeaderboard';

interface LeaderboardProps {
  testType: 'timed' | 'multitasking';
  currentUserName?: string;
  currentScore?: number;
  currentTime?: number;
  sessionId?: string;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 120) return '1m ago';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 7200) return '1h ago';
  return `${Math.floor(secs / 3600)}h ago`;
}

export function Leaderboard({
  testType,
  currentUserName,
  currentScore,
  currentTime,
  sessionId,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard(testType, 10);
      setEntries(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [testType]);

  const isCurrentUser = (entry: any) => sessionId && entry.session_id === sessionId;

  if (loading) {
    return (
      <div className="mt-6 p-8 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
        <span className="ml-3 text-gray-600">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const testLabel = testType === 'timed' ? 'Timed Test' : 'Multitasking Test';
  const testIcon = testType === 'timed' ? (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header: Test name + Sync */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {testIcon}
          {testLabel}
        </h2>
        <button
          onClick={loadLeaderboard}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync
        </button>
      </div>

      {/* TOP PERFORMERS */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top performers</h3>
          {lastUpdated && (
            <span className="text-xs text-gray-400">Updated {timeAgo(lastUpdated)}</span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No entries yet. Be the first!</div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const isCurrent = isCurrentUser(entry);
              const rank = index + 1;
              const rankBg =
                rank === 1
                  ? 'bg-amber-400 text-amber-900'
                  : rank === 2
                  ? 'bg-gray-300 text-gray-700'
                  : rank === 3
                  ? 'bg-orange-400 text-orange-900'
                  : isCurrent
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-600';
              const leftBorder =
                rank === 1
                  ? 'border-l-4 border-l-amber-400'
                  : rank === 3
                  ? 'border-l-4 border-l-orange-400'
                  : isCurrent
                  ? 'border-l-4 border-l-purple-500'
                  : '';

              return (
                <div
                  key={entry.id ?? entry.session_id ?? index}
                  className={`flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 ${leftBorder} ${
                    isCurrent ? 'ring-2 ring-purple-200 bg-purple-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${rankBg}`}
                    >
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold truncate ${isCurrent ? 'text-purple-700' : 'text-gray-800'}`}>
                          {entry.user_name || 'Anonymous'}
                          {isCurrent && ' (You)'}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      {entry.session_id && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                          {entry.session_id.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {testType === 'timed' ? (
                      <>
                        <div className="text-xl font-bold text-gray-900">
                          {entry.score != null ? entry.score : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isCurrent ? 'Your score' : 'Score'}
                        </div>
                        {entry.time_taken != null && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatTime(entry.time_taken)} time
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-bold text-gray-900">
                          {entry.score ?? 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isCurrent ? 'Your score' : 'Score'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current user not in top 10 */}
        {currentUserName && sessionId && !entries.some((e: any) => e.session_id === sessionId) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between p-4 rounded-lg ring-2 ring-purple-200 bg-purple-50/50 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                  —
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-700">{currentUserName} (You)</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                      Active
                    </span>
                  </div>
                  {sessionId && (
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{sessionId.substring(0, 8)}...</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {testType === 'timed' ? (
                  <>
                    <div className="text-xl font-bold text-gray-900">
                      {currentScore != null ? currentScore : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Your score</div>
                    {currentTime != null && (
                      <div className="text-xs text-gray-500 mt-0.5">{formatTime(currentTime)} time</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-gray-900">
                      {currentScore ?? 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Your score</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
