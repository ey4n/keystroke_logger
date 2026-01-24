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
 * Compares user transcription with reference text
 * Returns true if they match (after normalization), false otherwise
 */
export function validateTranscription(userInput: string): boolean {
  const normalizedUser = normalizeTextForComparison(userInput);
  const normalizedReference = normalizeTextForComparison(REFERENCE_TRANSCRIPTION);
  
  return normalizedUser === normalizedReference;
}

/**
 * Calculates transcription penalty
 * Returns 10 if there are errors, 0 if perfect
 */
export function calculateTranscriptionPenalty(userInput: string): number {
  if (!userInput || userInput.trim() === '') {
    return 10; // Empty input counts as error
  }
  
  const isValid = validateTranscription(userInput);
  return isValid ? 0 : 10;
}
