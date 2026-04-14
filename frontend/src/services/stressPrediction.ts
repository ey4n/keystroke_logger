import { getSupabase } from './supabaseClient';
import { KeystrokeEvent } from '../types/keystroke';

type PersistedKeystrokeEvent = {
  key: string;
  event_type: 'keydown' | 'keyup';
  pressed_at: string;
  meta?: {
    code?: string;
    challengeId?: number | null;
    elapsedSinceStart?: number | null;
  } | null;
  field_name?: string | null;
  session_id: string;
};

type PersistedFormSnapshot = {
  form_snapshot: Record<string, unknown> | null;
};

export type StressPredictionStatus =
  | 'stressed'
  | 'not_stressed'
  | 'no_baseline'
  | 'insufficient_data';

type ModelMetrics = {
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
};

export type StressPredictionResult = {
  status: StressPredictionStatus;
  reason: string;
  baselineModel?: {
    status: 'stressed' | 'not_stressed';
    confidence: number;
    probabilityStressed: number;
    modelUsed: string;
    modelAuc: number;
  };
  changeOnlyModel?: {
    status: 'stressed' | 'not_stressed';
    confidence: number;
    probabilityStressed: number;
    modelUsed: string;
    modelAuc: number;
  };
  percentChanges?: Partial<Record<keyof ModelMetrics, number>>;
};

const LONG_PAUSE_THRESHOLD_MS = 2000;
const BURST_PAUSE_CUTOFF_MS = 500;
const BURST_MIN_KEYS = 5;
const MODEL_API_URL =
  process.env.NEXT_PUBLIC_STRESS_MODEL_API_URL ?? 'http://127.0.0.1:8000';

const PERIPHERAL_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'Escape',
  'Enter',
  'Backspace',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stdDev(values: number[]) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[midpoint]!
    : (sorted[midpoint - 1]! + sorted[midpoint]!) / 2;
}

function sanitizePercentChange(current: number, baseline: number) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) return 0;
  const denominator = Math.abs(baseline) < 1e-6 ? 1e-6 : baseline;
  return clamp(((current - baseline) / denominator) * 100, -500, 500);
}

function computeAnswerLengthFromEvents(keydowns: KeystrokeEvent[]) {
  let length = 0;
  keydowns.forEach((event) => {
    if (event.key === 'Backspace') {
      length = Math.max(0, length - 1);
      return;
    }
    if (event.key.length === 1) {
      length += 1;
    }
  });
  return length;
}

function computeMetrics(events: KeystrokeEvent[]): ModelMetrics {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const keydowns = sorted.filter((event) => event.eventType === 'keydown');

  const durationMs =
    keydowns.length > 1
      ? keydowns[keydowns.length - 1]!.timestamp - keydowns[0]!.timestamp
      : 0;
  const durationMinutes = durationMs > 0 ? durationMs / 60000 : 0;
  const backspaces = keydowns.filter((event) => event.key === 'Backspace').length;
  const adjustedKpm =
    durationMinutes > 0 ? (keydowns.length - backspaces) / durationMinutes : 0;

  const interKeyLatencies: number[] = [];
  for (let i = 1; i < keydowns.length; i += 1) {
    const latency = keydowns[i]!.timestamp - keydowns[i - 1]!.timestamp;
    if (latency > 0 && latency < 5000) interKeyLatencies.push(latency);
  }

  const iklMeanMs =
    interKeyLatencies.length > 0
      ? interKeyLatencies.reduce((sum, value) => sum + value, 0) /
        interKeyLatencies.length
      : 0;
  const jitterMs = stdDev(interKeyLatencies);
  const iklVariance = jitterMs ** 2;
  const interKeyMedian = median(interKeyLatencies);
  const rhythmIndex =
    iklMeanMs > 0 ? clamp(1 - jitterMs / Math.max(iklMeanMs, interKeyMedian, 1), 0, 1) : 0;
  const longPauseCount = interKeyLatencies.filter(
    (latency) => latency >= LONG_PAUSE_THRESHOLD_MS
  ).length;

  let burstCount = 0;
  let currentBurstLen = 1;
  for (let i = 1; i < keydowns.length; i += 1) {
    const gap = keydowns[i]!.timestamp - keydowns[i - 1]!.timestamp;
    if (gap <= BURST_PAUSE_CUTOFF_MS) {
      currentBurstLen += 1;
    } else {
      if (currentBurstLen >= BURST_MIN_KEYS) burstCount += 1;
      currentBurstLen = 1;
    }
  }
  if (currentBurstLen >= BURST_MIN_KEYS) burstCount += 1;

  const totalPeripheralKeys = keydowns.filter((event) =>
    PERIPHERAL_KEYS.has(event.key)
  ).length;
  const errorCorrectionEvents = backspaces;
  const answerLength = computeAnswerLengthFromEvents(keydowns);

  return {
    adjusted_kpm: Number.isFinite(adjustedKpm) ? adjustedKpm : 0,
    ikl_mean_ms: Number.isFinite(iklMeanMs) ? iklMeanMs : 0,
    ikl_variance: Number.isFinite(iklVariance) ? iklVariance : 0,
    jitter_ms: Number.isFinite(jitterMs) ? jitterMs : 0,
    rhythm_index: Number.isFinite(rhythmIndex) ? rhythmIndex : 0,
    long_pause_count: longPauseCount,
    burst_count: burstCount,
    total_peripheral_keys: totalPeripheralKeys,
    error_correction_events: errorCorrectionEvents,
    answer_length: answerLength,
    spelling_error_count: 0,
    avg_spelling_edit_distance: 0,
  };
}

export function computeModelMetricsFromEvents(events: KeystrokeEvent[]): ModelMetrics {
  return computeMetrics(events);
}

function mapPersistedRowsToEvents(rows: PersistedKeystrokeEvent[]): KeystrokeEvent[] {
  return rows.map((row) => ({
    key: row.key,
    eventType: row.event_type,
    timestamp: new Date(row.pressed_at).getTime(),
    code: row.meta?.code || '',
    sessionId: row.session_id,
    fieldName: row.field_name ?? undefined,
    challengeId: row.meta?.challengeId ?? null,
    elapsedSinceStart: row.meta?.elapsedSinceStart ?? undefined,
  }));
}

export async function predictStressFromBaseline(params: {
  sessionId: string;
  testType: 'timed' | 'multitasking';
  currentEvents: KeystrokeEvent[];
}): Promise<StressPredictionResult> {
  const { sessionId, testType, currentEvents } = params;

  const currentKeydowns = currentEvents.filter((event) => event.eventType === 'keydown');
  if (currentKeydowns.length < 20) {
    return {
      status: 'insufficient_data',
      reason: `Not enough ${testType} keystroke data for prediction.`,
    };
  }

  const supabase = getSupabase();
  let baselineMetrics: ModelMetrics | null = null;

  const snapshotRes = await supabase
    .from('form_snapshots')
    .select('form_snapshot')
    .eq('session_id', sessionId)
    .eq('test_type', 'free')
    .limit(1)
    .maybeSingle();
  if (snapshotRes.error) throw snapshotRes.error;

  const freeSnapshot = snapshotRes.data as PersistedFormSnapshot | null;
  const snapshotBaseline = freeSnapshot?.form_snapshot?.keystroke_baseline_metrics as
    | Partial<ModelMetrics>
    | undefined;
  if (snapshotBaseline) {
    const expectedKeys = [
      'adjusted_kpm',
      'ikl_mean_ms',
      'ikl_variance',
      'jitter_ms',
      'rhythm_index',
      'long_pause_count',
      'burst_count',
      'total_peripheral_keys',
      'error_correction_events',
      'answer_length',
      'spelling_error_count',
      'avg_spelling_edit_distance',
    ] as const;
    const hasAll = expectedKeys.every((key) => typeof snapshotBaseline[key] === 'number');
    if (hasAll) {
      baselineMetrics = snapshotBaseline as ModelMetrics;
    }
  }

  // Fallback to keystrokes table if snapshot baseline is unavailable.
  if (!baselineMetrics) {
    const { data, error } = await supabase
      .from('keystrokes')
      .select('key, event_type, pressed_at, meta, field_name, session_id')
      .eq('session_id', sessionId)
      .eq('test_type', 'free')
      .order('pressed_at', { ascending: true });

    if (error) throw error;

    const baselineEvents = mapPersistedRowsToEvents((data ?? []) as PersistedKeystrokeEvent[]);
    const baselineKeydowns = baselineEvents.filter((event) => event.eventType === 'keydown');
    if (baselineEvents.length === 0) {
      return {
        status: 'no_baseline',
        reason:
          'Free baseline not found for this session. Complete and save free test first.',
      };
    }
    if (baselineKeydowns.length < 20) {
      return {
        status: 'insufficient_data',
        reason:
          'Free baseline exists but has too little keystroke data. Please type more in free test.',
      };
    }
    baselineMetrics = computeMetrics(baselineEvents);
  }
  if (!baselineMetrics) {
    return {
      status: 'no_baseline',
      reason: 'Unable to resolve baseline metrics for this session.',
    };
  }
  const baselineMetricsFinal = baselineMetrics;

  const currentMetrics = computeMetrics(currentEvents);
  const metricKeys = Object.keys(currentMetrics) as Array<keyof ModelMetrics>;
  const percentChanges: Partial<Record<keyof ModelMetrics, number>> = {};
  metricKeys.forEach((metric) => {
    percentChanges[metric] = sanitizePercentChange(
      currentMetrics[metric],
      baselineMetricsFinal[metric]
    );
  });

  const callModel = async (preferredModel: 'baseline' | 'change_only') => {
    let response: Response;
    try {
      response = await fetch(`${MODEL_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: testType,
          preferred_model: preferredModel,
          metrics_change: percentChanges,
          metrics_baseline: baselineMetricsFinal,
        }),
      });
    } catch {
      throw new Error(
        `Model API is not reachable at ${MODEL_API_URL}. Start backend/model_inference_api.py first.`
      );
    }
    if (!response.ok) {
      throw new Error(`Model API error: ${response.status}`);
    }
    return (await response.json()) as {
      label: 'stressed' | 'not_stressed';
      probability_stressed: number;
      model_used: string;
      model_auc: number;
    };
  };

  const baselineModelOut = await callModel('baseline');
  const changeOnlyModelOut = await callModel('change_only');

  const toDisplay = (modelOut: {
    label: 'stressed' | 'not_stressed';
    probability_stressed: number;
    model_used: string;
    model_auc: number;
  }) => {
    const probabilityStressed = clamp(modelOut.probability_stressed, 0, 1);
    const confidence =
      modelOut.label === 'stressed'
        ? probabilityStressed
        : 1 - probabilityStressed;
    return {
      status: modelOut.label,
      confidence,
      probabilityStressed,
      modelUsed: modelOut.model_used,
      modelAuc: modelOut.model_auc,
    };
  };

  return {
    status:
      baselineModelOut.label === 'stressed' || changeOnlyModelOut.label === 'stressed'
        ? 'stressed'
        : 'not_stressed',
    reason: 'Predicted using both baseline and percent-change models.',
    baselineModel: toDisplay(baselineModelOut),
    changeOnlyModel: toDisplay(changeOnlyModelOut),
    percentChanges,
  };
}
