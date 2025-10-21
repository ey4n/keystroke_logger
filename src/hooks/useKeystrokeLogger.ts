// src/hooks/useKeystrokeLogger.ts
import { useRef, useCallback } from 'react';
import type { KeystrokeEvent } from '../types/keystroke';

export interface KeystrokeAnalytics {
  totalEvents: number;
  keydownCount: number;
  keyupCount: number;
  duration: number; // in milliseconds
  averageSpeed: number; // keys per minute
  uniqueKeys: number;
}

export function useKeystrokeLogger() {
  const keystrokeData = useRef<KeystrokeEvent[]>([]);
  const startTime = useRef<number | null>(null);

  const logKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keydown',
      timestamp: Date.now(),
      code: e.code,
    };
    if (keystrokeData.current.length === 0) startTime.current = Date.now();
    keystrokeData.current.push(event);
    console.log('KeyDown:', event);
    return event;
  }, []);

  const logKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const event: KeystrokeEvent = {
      key: e.key,
      eventType: 'keyup',
      timestamp: Date.now(),
      code: e.code,
    };
    keystrokeData.current.push(event);
    console.log('KeyUp:', event);
    return event;
  }, []);

  const clearLogs = useCallback(() => {
    keystrokeData.current = [];
    startTime.current = null;
    console.log('Keystroke data cleared');
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
      if (duration > 0) averageSpeed = (keydownEvents.length / duration) * 60000;
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

  const exportAsJSON = useCallback(() => {
    const data = {
      events: keystrokeData.current,
      analytics: getAnalytics(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keystroke-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [getAnalytics]);

  const exportAsCSV = useCallback(() => {
    const headers = ['Index', 'Event Type', 'Key', 'Code', 'Timestamp'];
    const rows = keystrokeData.current.map((event, index) => [
      index + 1, event.eventType, event.key, event.code, event.timestamp,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keystroke-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
    logKeyDown,
    logKeyUp,
    clearLogs,
    keystrokeData: keystrokeData.current,
    getLogCount,
    getLogs,
    getAnalytics,
    getKeyPressDuration,
    getInterKeyDelay,
    exportAsJSON,
    exportAsCSV,
  };
}

export {};
