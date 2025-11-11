export interface KeystrokeEvent {
  key: string;
  eventType: 'keydown' | 'keyup';
  timestamp: number;           // epoch ms
  code: string;
  sessionId: string;          // typing session grouping
  fieldName?: string;          // which input/textarea
  challengeId?: number | null; // current challenge
  elapsedSinceStart?: number;  // ms since session start
  deviceInfo?: string;         // UA string (once per event is fine)
}

export type TestType = 'free' | 'timed' | 'multitasking' | 'noise' |'lying';

export interface TestConfig {
  id: TestType;
  name: string;
  description: string;
  enabled: boolean;
}