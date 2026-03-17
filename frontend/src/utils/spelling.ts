// Simple spelling analysis utilities for rough per-form spelling gauges.
// This is intentionally lightweight and dictionary-based (no external APIs).

export interface SpellingSummary {
  perQuestion: Record<string, number>;
  total: number;
  unknownTokensByQuestion: Record<string, string[]>;
}

const WORD_REGEX = /[A-Za-z]{3,}/g;

// Very small built‑in dictionary so the feature works out of the box.
// You can extend this list or replace it with a larger JSON word list.
const BUILT_IN_DICTIONARY = [
  'the', 'and', 'you', 'that', 'for', 'with', 'this', 'have', 'are', 'not',
  'but', 'from', 'they', 'will', 'would', 'there', 'their', 'about', 'which',
  'when', 'make', 'time', 'just', 'like', 'know', 'people', 'into', 'year',
  'good', 'some', 'could', 'them', 'other', 'than', 'then', 'also', 'only',
  'want', 'these', 'because', 'work', 'first', 'over', 'after', 'think',
  'still', 'back', 'use', 'very', 'even', 'many', 'feel', 'school', 'family',
  'friends', 'study', 'learn', 'online', 'college', 'university', 'project',
  'research', 'reading', 'writing', 'exercise', 'music', 'travel', 'health',
];

// Basic global whitelist for proper nouns, abbreviations, etc.
// Add domain‑specific words here to reduce false positives.
const BUILT_IN_WHITELIST = [
  'usa',
  'uk',
  'nyc',
  'california',
  'google',
  'microsoft',
  'netflix',
  'instagram',
  'linkedin',
  'whatsapp',
];

const DICTIONARY_SET = new Set(BUILT_IN_DICTIONARY.map(w => w.toLowerCase()));
const WHITELIST_SET = new Set(BUILT_IN_WHITELIST.map(w => w.toLowerCase()));

export interface CountSpellingErrorsOptions {
  dictionary?: Set<string>;
  whitelist?: Set<string>;
}

export function countSpellingErrors(
  text: string,
  options: CountSpellingErrorsOptions = {},
): { errors: number; unknownTokens: string[] } {
  const dictionary = options.dictionary ?? DICTIONARY_SET;
  const whitelist = options.whitelist ?? WHITELIST_SET;

  let errors = 0;
  const unknownTokens: string[] = [];

  const matches = text.match(WORD_REGEX) || [];
  for (const raw of matches) {
    const w = raw.toLowerCase();
    if (whitelist.has(w)) continue;
    if (!dictionary.has(w)) {
      errors += 1;
      unknownTokens.push(w);
    }
  }

  return { errors, unknownTokens };
}

// Convenience helper to compute summary for an entire form in one call.
export function computeFormSpellingSummary(
  formData: Record<string, unknown>,
  questionIds: string[],
  options: CountSpellingErrorsOptions = {},
): SpellingSummary {
  const perQuestion: Record<string, number> = {};
  const unknownTokensByQuestion: Record<string, string[]> = {};
  let total = 0;

  for (const id of questionIds) {
    const raw = formData[id];
    const value = typeof raw === 'string' ? raw : '';
    const { errors, unknownTokens } = countSpellingErrors(value, options);
    perQuestion[id] = errors;
    unknownTokensByQuestion[id] = unknownTokens;
    total += errors;
  }

  return { perQuestion, total, unknownTokensByQuestion };
}

