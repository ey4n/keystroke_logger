/**
 * Category question banks. One question per category is shown per form.
 * No overlap: each test type (free, timed, multitasking, lying) gets different questions in a session.
 */

export const QUESTION_CATEGORIES = [
  {
    id: 1,
    name: 'Personal Routine & Daily Life',
    questions: [
      'Describe your typical morning routine.',
      'Describe how you usually start your day.',
      'Describe a typical weekday for you.',
      'How do you typically spend your weekends?',
      'Describe how you usually wind down at the end of the day.',
    ],
  },
  {
    id: 2,
    name: 'Leisure & Positive Reflection',
    questions: [
      'Describe a recent experience that you found calm or relaxing.',
      'What would be your ideal holiday?',
      'Describe a place or activity that helps you relax.',
      'Describe a recent moment when you felt content or at ease.',
    ],
  },
  {
    id: 3,
    name: 'Emotional Stress Recall',
    questions: [
      'Describe a recent situation where you felt stressed, pressured, or overwhelmed.',
      'Describe a challenging situation that you found difficult to manage.',
      'Describe a time when you had too many responsibilities at once.',
      'Describe a situation where things did not go as planned and caused stress.',
    ],
  },
  {
    id: 4,
    name: 'Planning & Organization',
    questions: [
      'Explain how you usually keep track of tasks, reminders, or deadlines.',
      'Describe how you organize your responsibilities.',
      'Explain how you plan your activities for the week.',
      'Describe how you prioritize tasks when there are many to do.',
    ],
  },
  {
    id: 5,
    name: 'Adaptation & Change',
    questions: [
      'Describe how you typically respond when your plans change unexpectedly.',
      'Explain how you adjust when something disrupts your schedule.',
      'Describe how you handle unexpected changes in your routine.',
      'Explain how you respond when things don\'t go according to plan.',
    ],
  },
  {
    id: 6,
    name: 'Decision-Making & Reasoning',
    questions: [
      'Explain how you usually make decisions when choosing between options.',
      'Describe how you approach an important decision.',
      'Explain how you evaluate different choices before deciding.',
      'Describe how you decide what to focus on when time is limited.',
    ],
  },
  {
    id: 7,
    name: 'Explanation / Teaching Task',
    questions: [
      'Describe how you would explain a simple task or process to someone unfamiliar with it.',
      'Explain how to complete a simple everyday task step by step.',
      'Describe how you would teach someone to use a basic tool or app.',
      'Explain a simple process you know well.',
    ],
  },
] as const;

export type TestType = 'free' | 'timed' | 'multitasking' | 'lying';

const TEST_TYPES: TestType[] = ['free', 'timed', 'multitasking', 'lying'];

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Returns for each test type an array of 7 questions (one per category).
 * Within a session, no question is repeated across forms.
 * Assignment is stored in sessionStorage keyed by sessionId.
 */
export function getQuestionsForSession(sessionId: string): Record<TestType, string[]> {
  const empty: Record<TestType, string[]> = { free: [], timed: [], multitasking: [], lying: [] };
  if (!sessionId || typeof sessionId !== 'string') return empty;

  const key = `question_assignment_${sessionId}`;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Record<TestType, string[]>;
      }
    } catch (_) {
      // ignore
    }
  }

  const assignment: Record<TestType, string[]> = {
    free: [],
    timed: [],
    multitasking: [],
    lying: [],
  };

  for (const category of QUESTION_CATEGORIES) {
    const questions = category.questions;
    const indices = shuffle(questions.map((_, i) => i));
    // Assign one question per form (4 distinct questions per category)
    const numForms = Math.min(4, indices.length);
    for (let i = 0; i < numForms; i++) {
      assignment[TEST_TYPES[i]].push(questions[indices[i]]);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(assignment));
    } catch (_) {
      // ignore
    }
  }
  return assignment;
}

/**
 * Get the 7 questions for a specific test type in this session.
 */
export function getQuestionsForTest(sessionId: string, testType: TestType): string[] {
  const assignment = getQuestionsForSession(sessionId);
  return assignment[testType] || [];
}
