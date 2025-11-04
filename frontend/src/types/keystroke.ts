
export interface KeystrokeEvent {
  key: string;
  eventType: 'keydown' | 'keyup';
  timestamp: number;
  code: string;
}

export type TestType = 'free' | 'timed' | 'multitasking' | 'errorProne' | 'lying';

export interface TestConfig {
  id: TestType;
  name: string;
  description: string;
  enabled: boolean;
}