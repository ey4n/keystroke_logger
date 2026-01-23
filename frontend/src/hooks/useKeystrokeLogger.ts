// hooks/useKeystrokeLogger.ts
import { useRef, useCallback } from 'react';
import { KeystrokeEvent } from '../types/keystroke';

export interface KeystrokeAnalytics {
  totalEvents: number;
  keydownCount: number;
  keyupCount: number;
  duration: number;
  averageSpeed: number;
  uniqueKeys: number;
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

    if (logs.length > 0 && startTime.current) {
      const lastTimestamp = logs[logs.length - 1].timestamp;
      duration = lastTimestamp - startTime.current;
      if (duration > 0) averageSpeed = (keydownEvents.length / duration) * 60000; // KPM
    }

    return {
      totalEvents: logs.length,
      keydownCount: keydownEvents.length,
      keyupCount: keyupEvents.length,
      duration,
      averageSpeed: Math.round(averageSpeed),
      uniqueKeys,
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
