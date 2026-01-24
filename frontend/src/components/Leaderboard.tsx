'use client';

import React, { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardEntry as LeaderboardEntryType } from '../services/saveLeaderboard';

interface LeaderboardProps {
  testType: 'timed' | 'multitasking';
  currentUserName?: string;
  currentScore?: number;
  currentTime?: number;
  sessionId?: string;
}

export function Leaderboard({ 
  testType, 
  currentUserName, 
  currentScore, 
  currentTime,
  sessionId 
}: LeaderboardProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [testType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard(testType, 10);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentUser = (entry: any) => {
    return sessionId && entry.session_id === sessionId;
  };

  if (loading) {
    return (
      <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-6 bg-red-50 rounded-xl shadow-lg border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg border-2 border-indigo-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {testType === 'timed' ? '⏱️' : '🧠'}
          <span>{testType === 'timed' ? 'Timed Test' : 'Multitasking Test'} Leaderboard</span>
        </h2>
        <button
          onClick={loadLeaderboard}
          className="px-3 py-1 text-sm bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No entries yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isCurrent = isCurrentUser(entry);
            return (
              <div
                key={entry.id || index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-400 shadow-md'
                    : isCurrent
                    ? 'bg-indigo-100 border-indigo-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          isCurrent ? 'text-indigo-700' : 'text-gray-800'
                        }`}>
                          {entry.user_name || 'Anonymous'}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      {entry.session_id && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {entry.session_id.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {testType === 'timed' ? (
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {entry.time_taken ? formatTime(entry.time_taken) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">Time</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {entry.score ?? 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current User's Result (if not in top 10) */}
      {currentUserName && sessionId && !entries.some(e => e.session_id === sessionId) && (
        <div className="mt-4 pt-4 border-t-2 border-indigo-300">
          <p className="text-sm font-medium text-gray-700 mb-2">Your Result:</p>
          <div className="p-4 bg-indigo-100 border-2 border-indigo-400 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-700">{currentUserName}</span>
              {testType === 'timed' ? (
                <span className="text-xl font-bold text-indigo-600">
                  {currentTime ? formatTime(currentTime) : 'N/A'}
                </span>
              ) : (
                <span className="text-xl font-bold text-purple-600">
                  {currentScore ?? 'N/A'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
