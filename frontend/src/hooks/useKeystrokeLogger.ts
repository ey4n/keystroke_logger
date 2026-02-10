// hooks/useKeystrokeLogger.ts
import { useRef, useCallback } from 'react';
import { KeystrokeEvent } from '../types/keystroke';

export interface PerFieldStats {
  eventCount: number;
  durationMs: number;
}

export interface KeystrokeAnalytics {
  totalEvents: number;
  keydownCount: number;
  keyupCount: number;
  duration: number;
  averageSpeed: number;
  uniqueKeys: number;
  // Extended metrics (from events only)
  holdDurationAvgMs: number;
  holdDurationMinMs: number;
  holdDurationMaxMs: number;
  interKeyIntervalAvgMs: number;
  interKeyIntervalMedianMs: number;
  interKeyIntervalStdMs: number;
  pauseCount: number;           // gaps > 500ms between keydowns
  totalPauseTimeMs: number;
  backspaceRate: number;        // 0–1 (Backspace keydowns / keydownCount)
  rollingKPM30s: number;       // KPM over last 30s
  perField: Record<string, PerFieldStats>;
  typingRhythmConsistencyMs: number; // std dev of inter-key intervals
  longestPauseMs: number;
}

const PAUSE_THRESHOLD_MS = 500;

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, x) => sum + (x - avg) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// simple uuid-ish for session grouping
function genSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useKeystrokeLogger(externalSessionId?: string) {
  const sessionIdRef = useRef<string>(
    externalSessionId || 
    (globalThis.crypto?.randomUUID?.() ?? `sess_${Date.now()}`)
  );
  if (externalSessionId && sessionIdRef.current !== externalSessionId) {
    sessionIdRef.current = externalSessionId;
  }
  const keystrokeData = useRef<KeystrokeEvent[]>([]);
  const startTime = useRef<number | null>(null);

  // NEW context refs
  const currentFieldRef = useRef<string | undefined>(undefined);
  const activeChallengeIdRef = useRef<number | null>(null);
  const deviceInfoRef = useRef<string>(
    typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  );

  // expose setters so components can tell us which field/challenge is active
  const setFieldName = useCallback((name?: string) => {
    currentFieldRef.current = name;
  }, []);

  const setActiveChallenge = useCallback((id: number | null) => {
    activeChallengeIdRef.current = id;
  }, []);

  // Change the type to accept both HTMLTextAreaElement and HTMLInputElement
  const logKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const now = Date.now();
    if (keystrokeData.current.length === 0) {
      startTime.current = now;
    }
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keydown',
      timestamp: now,
      code: e.code,

      // NEW context
      sessionId: sessionIdRef.current,
      fieldName: currentFieldRef.current,
      challengeId: activeChallengeIdRef.current,
      elapsedSinceStart: startTime.current ? now - startTime.current : 0,
      deviceInfo: deviceInfoRef.current,
    };

    keystrokeData.current.push(event);
    // console.log('KeyDown:', event);
    return event;
  }, []);

  const logKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const now = Date.now();
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keyup',
      timestamp: now,
      code: e.code,

      // NEW context
      sessionId: sessionIdRef.current,
      fieldName: currentFieldRef.current,
      challengeId: activeChallengeIdRef.current,
      elapsedSinceStart: startTime.current ? now - startTime.current : 0,
      deviceInfo: deviceInfoRef.current,
    };

    keystrokeData.current.push(event);
    // console.log('KeyUp:', event);
    return event;
  }, []);

  /**
   * Mobile / virtual keyboard fallback: many phones don't fire keydown/keyup for the soft keyboard.
   * Only runs on mobile (touch + narrow viewport) so desktop keystroke monitoring is unchanged.
   * Use from onBeforeInput: when a single character is inserted we log a synthetic keydown + keyup.
   */
  const logInputFallback = useCallback((ev: { data?: string | null; inputType?: string }) => {
    if (typeof window === 'undefined') return;
    // Only use fallback on mobile; desktop keeps using keydown/keyup only
    const isMobile =
      navigator.maxTouchPoints > 0 &&
      window.innerWidth <= 1024;
    if (!isMobile) return;

    const inputType = ev.inputType || '';
    const data = ev.data;
    if (inputType !== 'insertText' || data == null || data.length === 0) return;
    // Only log single-character inserts (one key at a time); paste may have many chars
    if (data.length > 1) return;

    const now = Date.now();
    if (keystrokeData.current.length === 0) {
      startTime.current = now;
    }
    const elapsed = startTime.current ? now - startTime.current : 0;
    const base = {
      sessionId: sessionIdRef.current,
      fieldName: currentFieldRef.current,
      challengeId: activeChallengeIdRef.current,
      elapsedSinceStart: elapsed,
      deviceInfo: deviceInfoRef.current,
    };

    keystrokeData.current.push({
      key: data,
      eventType: 'keydown',
      timestamp: now,
      code: 'VirtualKey',
      ...base,
    });
    keystrokeData.current.push({
      key: data,
      eventType: 'keyup',
      timestamp: now + 1,
      code: 'VirtualKey',
      ...base,
    });
  }, []);

  const clearLogs = useCallback(() => {
    keystrokeData.current = [];
    startTime.current = null;

    // NEW: start a fresh session
    sessionIdRef.current = genSessionId();
    activeChallengeIdRef.current = null;
    // console.log('Keystroke data cleared');
  }, []);

  const getLogCount = useCallback(() => keystrokeData.current.length, []);
  const getLogs = useCallback(() => [...keystrokeData.current], []);

  const getAnalytics = useCallback(() => {
    const logs = keystrokeData.current;
    const keydownEvents = logs.filter(e => e.eventType === 'keydown');
    const keyupEvents = logs.filter(e => e.eventType === 'keyup');
    const uniqueKeys = new Set(logs.map(e => e.key)).size;

    let duration = 0;
    let averageSpeed = 0;
    const lastTimestamp = logs.length > 0 ? logs[logs.length - 1]!.timestamp : 0;
    if (logs.length > 0 && startTime.current) {
      duration = lastTimestamp - startTime.current;
      if (duration > 0) averageSpeed = (keydownEvents.length / duration) * 60000; // KPM
    }

    // Hold durations: pair keydown-keyup by code
    const holdDurations: number[] = [];
    for (let i = 0; i < logs.length - 1; i++) {
      const ev = logs[i]!;
      if (ev.eventType !== 'keydown') continue;
      for (let j = i + 1; j < logs.length; j++) {
        const next = logs[j]!;
        if (next.code === ev.code && next.eventType === 'keyup') {
          holdDurations.push(next.timestamp - ev.timestamp);
          break;
        }
      }
    }
    const holdDurationAvgMs = holdDurations.length > 0 ? holdDurations.reduce((a, b) => a + b, 0) / holdDurations.length : 0;
    const holdDurationMinMs = holdDurations.length > 0 ? Math.min(...holdDurations) : 0;
    const holdDurationMaxMs = holdDurations.length > 0 ? Math.max(...holdDurations) : 0;

    // Inter-key delays (keydown to keydown)
    const interKeyDelays: number[] = [];
    for (let i = 1; i < keydownEvents.length; i++) {
      interKeyDelays.push(keydownEvents[i]!.timestamp - keydownEvents[i - 1]!.timestamp);
    }
    const interKeyIntervalAvgMs = interKeyDelays.length > 0 ? interKeyDelays.reduce((a, b) => a + b, 0) / interKeyDelays.length : 0;
    const interKeyIntervalMedianMs = median(interKeyDelays);
    const interKeyIntervalStdMs = stdDev(interKeyDelays);
    const longestPauseMs = interKeyDelays.length > 0 ? Math.max(...interKeyDelays) : 0;

    // Pauses: gaps > threshold
    const pauseCount = interKeyDelays.filter(d => d > PAUSE_THRESHOLD_MS).length;
    const totalPauseTimeMs = interKeyDelays.filter(d => d > PAUSE_THRESHOLD_MS).reduce((a, b) => a + b, 0);

    // Backspace rate
    const backspaceCount = keydownEvents.filter(e => e.key === 'Backspace').length;
    const backspaceRate = keydownEvents.length > 0 ? backspaceCount / keydownEvents.length : 0;

    // Rolling KPM (last 30s)
    const windowMs = 30_000;
    const cutoff = lastTimestamp - windowMs;
    const keydownsInWindow = keydownEvents.filter(e => e.timestamp >= cutoff).length;
    const rollingKPM30s = keydownsInWindow > 0 && windowMs > 0 ? Math.round((keydownsInWindow / (windowMs / 60_000))) : 0;

    // Per-field: event count and time span (first to last event in that field)
    const perField: Record<string, PerFieldStats> = {};
    const byField = new Map<string, KeystrokeEvent[]>();
    for (const e of keydownEvents) {
      const fn = e.fieldName ?? '_unknown_';
      if (!byField.has(fn)) byField.set(fn, []);
      byField.get(fn)!.push(e);
    }
    byField.forEach((evs, fieldName) => {
      const first = evs[0]!.timestamp;
      const last = evs[evs.length - 1]!.timestamp;
      perField[fieldName] = { eventCount: evs.length, durationMs: last - first };
    });

    return {
      totalEvents: logs.length,
      keydownCount: keydownEvents.length,
      keyupCount: keyupEvents.length,
      duration,
      averageSpeed: Math.round(averageSpeed),
      uniqueKeys,
      holdDurationAvgMs: Math.round(holdDurationAvgMs),
      holdDurationMinMs,
      holdDurationMaxMs,
      interKeyIntervalAvgMs: Math.round(interKeyIntervalAvgMs),
      interKeyIntervalMedianMs: Math.round(interKeyIntervalMedianMs),
      interKeyIntervalStdMs: Math.round(interKeyIntervalStdMs),
      pauseCount,
      totalPauseTimeMs,
      backspaceRate,
      rollingKPM30s,
      perField,
      typingRhythmConsistencyMs: Math.round(interKeyIntervalStdMs),
      longestPauseMs,
    } as KeystrokeAnalytics;
  }, []);

  const getKeyPressDuration = useCallback((keyCode: string) => {
    const logs = keystrokeData.current;
    const durations: number[] = [];
    for (let i = 0; i < logs.length - 1; i++) {
      if (logs[i].code === keyCode && logs[i].eventType === 'keydown') {
        for (let j = i + 1; j < logs.length; j++) {
          if (logs[j].code === keyCode && logs[j].eventType === 'keyup') {
            durations.push(logs[j].timestamp - logs[i].timestamp);
            break;
          }
        }
      }
    }
    return durations;
  }, []);

  const getInterKeyDelay = useCallback(() => {
    const keydownEvents = keystrokeData.current.filter(e => e.eventType === 'keydown');
    const delays: number[] = [];
    for (let i = 1; i < keydownEvents.length; i++) {
      delays.push(keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp);
    }
    return delays;
  }, []);

  return {
    // logging
    logKeyDown,
    logKeyUp,
    /** Call from onBeforeInput on inputs/textareas to capture typing on mobile (virtual keyboard). */
    logInputFallback,

    // session / context controls (NEW)
    setFieldName,
    setActiveChallenge,

    // utilities
    clearLogs,
    keystrokeData: keystrokeData.current,
    getLogCount,
    getLogs,
    getAnalytics,
    getKeyPressDuration,
    getInterKeyDelay,
  };
}

export {};
