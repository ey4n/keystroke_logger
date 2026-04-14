// Dev-only helper for quickly testing spelling metrics against sample answers.
// You can call runSpellingHarness(...) from a Node script or temporary entrypoint.

import type { FormData } from '../types/formdata';
import { computeFormSpellingSummary } from './spelling';

export interface SpellingHarnessSample {
  id: string;
  formData: Partial<FormData>;
  questionIds: string[];
}

export function runSpellingHarness(samples: SpellingHarnessSample[]) {
  // eslint-disable-next-line no-console
  console.log('Running spelling harness on', samples.length, 'samples');

  for (const sample of samples) {
    const summary = computeFormSpellingSummary(
      sample.formData as Record<string, unknown>,
      sample.questionIds,
    );

    // eslint-disable-next-line no-console
    console.log('--- Sample', sample.id, '---');
    // eslint-disable-next-line no-console
    console.log('Total spelling errors:', summary.total);
    // eslint-disable-next-line no-console
    console.log('Errors by question:', summary.perQuestion);
    // eslint-disable-next-line no-console
    console.log('Unknown tokens (per question):', summary.unknownTokensByQuestion);
  }
}

