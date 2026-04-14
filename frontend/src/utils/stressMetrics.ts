import { KeystrokeEvent } from '../types/keystroke';

export interface StressMetrics {
  adjusted_kpm: number;
  ikl_mean_ms: number;
  ikl_variance: number;
  jitter_ms: number;
  rhythm_index: number;
  long_pause_count: number;
  burst_count: number;
  total_peripheral_keys: number;
  error_correction_events: number;
  answer_length: number;
  spelling_error_count: number;
  avg_spelling_edit_distance: number;
}

const BURST_GAP_MS = 500;
const LONG_PAUSE_MS = 2000;
const MIN_BURST_KEYS = 5;

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
}

function isPeripheralKey(key: string): boolean {
  if (!key) return true;
  if (key.length === 1) return false;
  return key !== 'Space';
}

export function computeStressMetricsFromEvents(events: KeystrokeEvent[]): StressMetrics {
  if (!events.length) {
    return {
      adjusted_kpm: 0,
      ikl_mean_ms: 0,
      ikl_variance: 0,
      jitter_ms: 0,
      rhythm_index: 0,
      long_pause_count: 0,
      burst_count: 0,
      total_peripheral_keys: 0,
      error_correction_events: 0,
      answer_length: 0,
      spelling_error_count: 0,
      avg_spelling_edit_distance: 0,
    };
  }

  const keydowns = events
    .filter((ev) => ev.eventType === 'keydown')
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!keydowns.length) {
    return {
      adjusted_kpm: 0,
      ikl_mean_ms: 0,
      ikl_variance: 0,
      jitter_ms: 0,
      rhythm_index: 0,
      long_pause_count: 0,
      burst_count: 0,
      total_peripheral_keys: 0,
      error_correction_events: 0,
      answer_length: 0,
      spelling_error_count: 0,
      avg_spelling_edit_distance: 0,
    };
  }

  const firstTs = keydowns[0].timestamp;
  const lastTs = keydowns[keydowns.length - 1].timestamp;
  const durationMs = Math.max(1, lastTs - firstTs);
  const durationMin = durationMs / 60000;

  const interKeyLatencies: number[] = [];
  for (let i = 1; i < keydowns.length; i += 1) {
    interKeyLatencies.push(Math.max(0, keydowns[i].timestamp - keydowns[i - 1].timestamp));
  }

  const correctionEvents = keydowns.filter(
    (ev) => ev.key === 'Backspace' || ev.key === 'Delete'
  ).length;
  const peripheralCount = keydowns.filter((ev) => isPeripheralKey(ev.key)).length;
  const printableCount = keydowns.filter((ev) => ev.key.length === 1 || ev.key === 'Space').length;

  let burstCount = 0;
  let currentBurstLen = keydowns.length > 0 ? 1 : 0;
  for (const latency of interKeyLatencies) {
    if (latency <= BURST_GAP_MS) {
      currentBurstLen += 1;
    } else {
      if (currentBurstLen >= MIN_BURST_KEYS) burstCount += 1;
      currentBurstLen = 1;
    }
  }
  if (currentBurstLen >= MIN_BURST_KEYS) burstCount += 1;

  const iklMean = mean(interKeyLatencies);
  const iklVariance = variance(interKeyLatencies);
  const jitter = Math.sqrt(iklVariance);
  const rhythmIndex = iklMean > 0 ? 1 / (1 + jitter / iklMean) : 0;

  const netTyped = Math.max(0, printableCount - correctionEvents);
  const adjustedKpm = durationMin > 0 ? netTyped / durationMin : 0;

  return {
    adjusted_kpm: toNumber(adjustedKpm),
    ikl_mean_ms: toNumber(iklMean),
    ikl_variance: toNumber(iklVariance),
    jitter_ms: toNumber(jitter),
    rhythm_index: toNumber(rhythmIndex),
    long_pause_count: interKeyLatencies.filter((lat) => lat > LONG_PAUSE_MS).length,
    burst_count: burstCount,
    total_peripheral_keys: peripheralCount,
    error_correction_events: correctionEvents,
    answer_length: netTyped,
    spelling_error_count: 0,
    avg_spelling_edit_distance: 0,
  };
}

export function computePercentChange(current: number, baseline: number): number {
  if (baseline === 0) return current === 0 ? 0 : 100;
  return ((current - baseline) / baseline) * 100;
}
