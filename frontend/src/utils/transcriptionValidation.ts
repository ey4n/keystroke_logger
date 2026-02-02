// Reference transcription text
export const REFERENCE_TRANSCRIPTION = `Modern workplaces often require individuals to manage multiple tasks under strict deadlines.
Responding to emails, completing reports, and coordinating with others can become stressful,
especially when unexpected changes occur. Maintaining focus and accuracy during such situations
is important for effective performance.`;

/**
 * Normalizes text for comparison: lowercase, removes extra spaces, removes quotes, trims
 */
export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[""]/g, '') // Remove quotes (both straight and curly)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Levenshtein (edit) distance: minimum number of single-character edits
 * (insert, delete, substitute) to turn one string into the other.
 * Used as the "error count" for transcription.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Compares user transcription with reference text.
 * If referenceText is provided, use it; otherwise use REFERENCE_TRANSCRIPTION.
 */
export function validateTranscription(
  userInput: string,
  referenceText?: string
): boolean {
  const normalizedUser = normalizeTextForComparison(userInput);
  const ref = referenceText ?? REFERENCE_TRANSCRIPTION;
  const normalizedReference = normalizeTextForComparison(ref);
  return normalizedUser === normalizedReference;
}

const MAX_PENALTY = 10;

/**
 * Returns error count (edit distance) and points deducted.
 * Penalty: 1 point per error, capped at 10 (so 10+ errors = 10 points).
 * Empty input is treated as 10 errors → 10 points.
 * Pass referenceText when the user was shown a specific paragraph (e.g. from question pool);
 * otherwise the default REFERENCE_TRANSCRIPTION is used.
 */
export function getTranscriptionPenaltyDetails(
  userInput: string,
  referenceText?: string
): {
  errorCount: number;
  penalty: number;
} {
  if (!userInput || userInput.trim() === '') {
    return { errorCount: 10, penalty: MAX_PENALTY };
  }
  const ref = referenceText ?? REFERENCE_TRANSCRIPTION;
  const normalizedUser = normalizeTextForComparison(userInput);
  const normalizedReference = normalizeTextForComparison(ref);
  const errorCount = levenshteinDistance(normalizedUser, normalizedReference);
  const penalty = Math.min(errorCount, MAX_PENALTY);
  return { errorCount, penalty };
}

/**
 * Calculates transcription penalty (for scoring).
 * 1 point per error, capped at 10.
 */
export function calculateTranscriptionPenalty(
  userInput: string,
  referenceText?: string
): number {
  return getTranscriptionPenaltyDetails(userInput, referenceText).penalty;
}

const SNIPPET_LEN = 25;

/**
 * Finds the first position where two strings differ (character-by-character).
 * Returns context snippets for reference and user text, or null if identical.
 */
function findFirstDifference(
  normalizedUser: string,
  normalizedReference: string
): { refSnippet: string; userSnippet: string; position: number } | null {
  const minLen = Math.min(normalizedUser.length, normalizedReference.length);
  for (let i = 0; i < minLen; i++) {
    if (normalizedUser[i] !== normalizedReference[i]) {
      const start = Math.max(0, i - SNIPPET_LEN);
      const refSnippet = normalizedReference.slice(start, i + SNIPPET_LEN);
      const userSnippet = normalizedUser.slice(start, i + SNIPPET_LEN);
      return { refSnippet, userSnippet, position: i };
    }
  }
  if (normalizedUser.length !== normalizedReference.length) {
    const i = minLen;
    const start = Math.max(0, i - SNIPPET_LEN);
    const refSnippet = normalizedReference.slice(start, i + SNIPPET_LEN);
    const userSnippet = normalizedUser.slice(start, i + SNIPPET_LEN);
    return { refSnippet, userSnippet, position: i };
  }
  return null;
}

/**
 * Returns a short, human-readable explanation of why transcription points were lost.
 * Use this below the points in the error message.
 */
export function getTranscriptionErrorExplanation(
  userInput: string,
  referenceText?: string
): string {
  const ref = referenceText ?? REFERENCE_TRANSCRIPTION;
  const normalizedUser = normalizeTextForComparison(userInput);
  const normalizedReference = normalizeTextForComparison(ref);

  if (normalizedUser === normalizedReference) return '';

  const { errorCount, penalty } = getTranscriptionPenaltyDetails(userInput, referenceText);
  const lines: string[] = [];

  lines.push(
    `Your text differed from the reference by ${errorCount} character-level change(s) (wrong, missing, or extra characters). Each change = 1 error; 1 point deducted per error, up to 10.`
  );

  const firstDiff = findFirstDifference(normalizedUser, normalizedReference);
  if (firstDiff) {
    const { refSnippet, userSnippet } = firstDiff;
    const refDisplay = refSnippet.length > 40 ? '…' + refSnippet.slice(-38) : refSnippet;
    const userDisplay = userSnippet.length > 40 ? '…' + userSnippet.slice(-38) : userSnippet;
    lines.push(`First difference: reference had "${refDisplay}" but you had "${userDisplay}".`);
  }

  return lines.join(' ');
}
