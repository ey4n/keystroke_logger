import { getSupabase } from './supabaseClient';
import { KeystrokeEvent } from '../types/keystroke';
import {
  computePercentChange,
  computeStressMetricsFromEvents,
  StressMetrics,
} from '../utils/stressMetrics';

export type PreferredModel = 'baseline' | 'change_only';

export interface SingleModelPrediction {
  preferred_model: PreferredModel;
  probability: number;
  label: 'stressed' | 'not_stressed';
}

export interface StressPredictionBundle {
  session_id: string;
  test_type: 'timed' | 'multitasking';
  baseline_metrics: StressMetrics;
  current_metrics: StressMetrics;
  pct_changes: Record<string, number>;
  with_respect_to_baseline: SingleModelPrediction;
  with_respect_to_baseline_change_only: SingleModelPrediction;
}

type PredictResponse = {
  preferred_model: PreferredModel;
  probability: number;
  label: 'stressed' | 'not_stressed';
};

type DbKeystrokeRow = {
  key: string;
  event_type: 'keydown' | 'keyup';
  pressed_at: string;
  meta?: { code?: string } | null;
  session_id: string;
};

/**
 * Prediction URL for POST /predict.
 * Default: same-origin proxy (no CORS). Set NEXT_PUBLIC_STRESS_MODEL_API_URL to call the API directly.
 */
function modelPredictUrl(): string {
  const direct = process.env.NEXT_PUBLIC_STRESS_MODEL_API_URL?.replace(/\/$/, '');
  if (direct) return `${direct}/predict`;
  if (typeof window !== 'undefined') return '/api/stress-predict';
  return `${process.env.STRESS_MODEL_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000'}/predict`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildFeaturePayload(
  baselineMetrics: StressMetrics,
  currentMetrics: StressMetrics
): Record<string, number> {
  const payload: Record<string, number> = {};
  const metricNames = Object.keys(currentMetrics) as Array<keyof StressMetrics>;

  for (const metric of metricNames) {
    const current = Number(currentMetrics[metric] ?? 0);
    const baseline = Number(baselineMetrics[metric] ?? 0);
    const change = current - baseline;
    const pctChange = computePercentChange(current, baseline);

    payload[String(metric)] = round2(current);
    payload[`current_${String(metric)}`] = round2(current);
    payload[`baseline_${String(metric)}`] = round2(baseline);
    payload[`change_${String(metric)}`] = round2(change);
    payload[`pct_change_${String(metric)}`] = round2(pctChange);
  }

  return payload;
}

function extractPctChanges(
  baselineMetrics: StressMetrics,
  currentMetrics: StressMetrics
): Record<string, number> {
  const out: Record<string, number> = {};
  const metricNames = Object.keys(currentMetrics) as Array<keyof StressMetrics>;
  for (const metric of metricNames) {
    out[String(metric)] = round2(
      computePercentChange(Number(currentMetrics[metric] ?? 0), Number(baselineMetrics[metric] ?? 0))
    );
  }
  return out;
}

async function getBaselineMetricsFromFreeSnapshot(sessionId: string): Promise<StressMetrics | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('form_snapshots')
    .select('form_snapshot')
    .eq('session_id', sessionId)
    .eq('test_type', 'free')
    .maybeSingle();

  if (error) throw error;
  const metrics = data?.form_snapshot?.keystroke_baseline_metrics;
  if (!metrics || typeof metrics !== 'object') return null;
  return metrics as StressMetrics;
}

async function getBaselineMetricsFromFreeKeystrokes(sessionId: string): Promise<StressMetrics | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('keystrokes')
    .select('key,event_type,pressed_at,meta,session_id')
    .eq('session_id', sessionId)
    .eq('test_type', 'free')
    .order('pressed_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const events: KeystrokeEvent[] = (data as DbKeystrokeRow[]).map((row) => ({
    key: row.key,
    eventType: row.event_type,
    timestamp: new Date(row.pressed_at).getTime(),
    code: row.meta?.code || '',
    sessionId: row.session_id,
  }));

  return computeStressMetricsFromEvents(events);
}

async function getBaselineMetrics(sessionId: string): Promise<StressMetrics | null> {
  const fromSnapshot = await getBaselineMetricsFromFreeSnapshot(sessionId);
  if (fromSnapshot) return fromSnapshot;
  return getBaselineMetricsFromFreeKeystrokes(sessionId);
}

async function requestPrediction(
  preferredModel: PreferredModel,
  sessionId: string,
  testType: 'timed' | 'multitasking',
  features: Record<string, number>
): Promise<SingleModelPrediction> {
  const response = await fetch(modelPredictUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      test_type: testType,
      preferred_model: preferredModel,
      features,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model API (${preferredModel}) failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as PredictResponse;
  return {
    preferred_model: result.preferred_model,
    probability: result.probability,
    label: result.label,
  };
}

export async function predictStressForSession(
  sessionId: string,
  testType: 'timed' | 'multitasking',
  currentEvents: KeystrokeEvent[]
): Promise<StressPredictionBundle> {
  const baselineMetrics = await getBaselineMetrics(sessionId);
  if (!baselineMetrics) {
    throw new Error(
      'Baseline free-typing metrics were not found for this session. Complete and save Free test first.'
    );
  }

  const currentMetrics = computeStressMetricsFromEvents(currentEvents);
  const features = buildFeaturePayload(baselineMetrics, currentMetrics);

  const [baselineModelPrediction, changeOnlyPrediction] = await Promise.all([
    requestPrediction('baseline', sessionId, testType, features),
    requestPrediction('change_only', sessionId, testType, features),
  ]);

  return {
    session_id: sessionId,
    test_type: testType,
    baseline_metrics: baselineMetrics,
    current_metrics: currentMetrics,
    pct_changes: extractPctChanges(baselineMetrics, currentMetrics),
    with_respect_to_baseline: baselineModelPrediction,
    with_respect_to_baseline_change_only: changeOnlyPrediction,
  };
}
