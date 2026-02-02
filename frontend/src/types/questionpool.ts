// Question pools categorized by type
export interface Question {
  id: string;
  label: string;
  type: 'short' | 'direct-long' | 'indirect-long' | 'transcription';
  category: 'personal' | 'reflection' | 'cognitive' | 'transcription';
}

export interface TranscriptionQuestion extends Question {
  paragraph: string;
  instructions: string;
}

export const QUESTION_POOLS = {
  // Required short answer question - ALWAYS first
  requiredShort: [
    { id: 'fullName', label: 'Full Name', type: 'short', category: 'personal' },
  ] as Question[],

  // Optional short answer questions (5 available - select 3 more)
  short: [
    { id: 'email', label: 'Email Address', type: 'short', category: 'personal' },
    { id: 'age', label: 'Age', type: 'short', category: 'personal' },
    { id: 'occupation', label: 'Occupation', type: 'short', category: 'personal' },
    { id: 'location', label: 'Country', type: 'short', category: 'personal' },
    { id: 'education', label: 'Highest Education Level', type: 'short', category: 'personal' },
  ] as Question[],

  // Direct long-answer questions - straightforward recall/description (select 4-5)
  directLong: [
    { id: 'morningRoutine', label: 'Describe your typical morning routine', type: 'direct-long', category: 'reflection' },
    { id: 'weekendActivity', label: 'How do you typically spend your weekends?', type: 'direct-long', category: 'reflection' },
    { id: 'favoriteMemory', label: 'What\'s your favorite memory from the past year?', type: 'direct-long', category: 'reflection' },
    { id: 'dailySchedule', label: 'Describe your typical daily schedule', type: 'direct-long', category: 'reflection' },
    { id: 'hobbies', label: 'What are your main hobbies or interests?', type: 'direct-long', category: 'reflection' },
    { id: 'recentBook', label: 'Describe the last book or article you read', type: 'direct-long', category: 'reflection' },
    { id: 'favoritePlace', label: 'Describe your favorite place to relax or unwind', type: 'direct-long', category: 'reflection' },
  ] as Question[],

  // Indirect long-answer questions - require thought/analysis (select 4-5)
  indirectLong: [
    { id: 'calmExperience', label: 'Describe a recent experience that you found calm or relaxing.', type: 'indirect-long', category: 'cognitive' },
    { id: 'stressfulSituation', label: 'Describe a recent situation where you felt stressed, pressured, or overwhelmed.', type: 'indirect-long', category: 'cognitive' },
    { id: 'idealHoliday', label: 'What would be your ideal holiday?', type: 'indirect-long', category: 'cognitive' },
    { id: 'fiveYearsFromNow', label: 'Where do you see yourself 5 years from now?', type: 'indirect-long', category: 'cognitive' },
    { id: 'taskTracking', label: 'Explain how you usually keep track of tasks, reminders, or deadlines.', type: 'indirect-long', category: 'cognitive' },
    { id: 'unexpectedChanges', label: 'Describe how you typically respond when your plans change unexpectedly.', type: 'indirect-long', category: 'cognitive' },
    { id: 'recentLearning', label: 'Describe something you learned recently that you found useful.', type: 'indirect-long', category: 'cognitive' },
    { id: 'decisionMaking', label: 'Explain how you usually make decisions when choosing between options.', type: 'indirect-long', category: 'cognitive' },
    { id: 'explainingTasks', label: 'Describe how you would explain a simple task or process to someone unfamiliar with it.', type: 'indirect-long', category: 'cognitive' },
    { id: 'problemSolving', label: 'Describe your approach when facing a challenging problem.', type: 'indirect-long', category: 'cognitive' },
    { id: 'workLifeBalance', label: 'How do you maintain balance between work and personal life?', type: 'indirect-long', category: 'cognitive' },
    { id: 'conflictResolution', label: 'Describe how you handle disagreements or conflicts with others.', type: 'indirect-long', category: 'cognitive' },
  ] as Question[],

  // Transcription tasks - different paragraphs to copy (select 1 randomly)
  transcription: [
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Modern workplaces often require individuals to manage multiple tasks under strict deadlines. Responding to emails, completing reports, and coordinating with others can become stressful, especially when unexpected changes occur. Maintaining focus and accuracy during such situations is important for effective performance.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Effective communication relies on clarity and active listening. When sharing ideas or instructions, it is essential to ensure that the message is understood correctly. Asking questions and providing feedback helps prevent misunderstandings and builds stronger working relationships in professional environments.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Time management is a critical skill for balancing work and personal responsibilities. Setting priorities, creating schedules, and avoiding distractions can significantly improve productivity. By organizing tasks effectively, individuals can reduce stress and achieve their goals more efficiently.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Learning new skills requires dedication and consistent practice over time. Whether mastering a language, developing technical expertise, or improving creative abilities, progress depends on regular effort. Staying motivated through challenges and celebrating small achievements can help maintain momentum.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Collaborative projects benefit from diverse perspectives and shared expertise. Team members contribute unique insights that can lead to innovative solutions and better outcomes. Fostering an environment of trust and open communication encourages creativity and strengthens team cohesion.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
    {
      id: 'transcription',
      label: 'Type the paragraph above exactly as shown:',
      type: 'transcription',
      category: 'transcription',
      paragraph: 'Adapting to change is an essential part of professional development. New technologies, processes, and responsibilities emerge regularly in most fields. Embracing flexibility and maintaining a growth mindset enables individuals to navigate transitions successfully and continue advancing in their careers.',
      instructions: 'Please read the paragraph below carefully, then type it exactly as shown in the text box. Include punctuation (e.g. periods, commas) as shown.',
    },
  ] as TranscriptionQuestion[],
};

export interface QuestionSet {
  requiredShort: Question[];
  short: Question[];
  directLong: Question[];
  indirectLong: Question[];
  transcription: TranscriptionQuestion[];
}

/**
 * Randomly select questions from each category
 * Full Name is ALWAYS included as the first question
 * @param shortCount - Number of additional short questions to select (default: 3)
 * @param directLongCount - Number of direct long questions to select (default: 4)
 * @param indirectLongCount - Number of indirect long questions to select (default: 4)
 * @returns A set of randomly selected questions
 */
export function generateQuestionSet(
  shortCount: number = 3,
  directLongCount: number = 4,
  indirectLongCount: number = 4
): QuestionSet {
  return {
    requiredShort: QUESTION_POOLS.requiredShort, // Always include Full Name
    short: selectRandomQuestions(QUESTION_POOLS.short, shortCount),
    directLong: selectRandomQuestions(QUESTION_POOLS.directLong, directLongCount),
    indirectLong: selectRandomQuestions(QUESTION_POOLS.indirectLong, indirectLongCount),
    transcription: selectRandomQuestions(QUESTION_POOLS.transcription, 1) as TranscriptionQuestion[], // Select 1 random transcription
  };
}

/**
 * Helper function to randomly select n items from an array without replacement
 */
function selectRandomQuestions<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Generate a seeded question set for reproducibility
 * Full Name is ALWAYS included as the first question
 * Useful if you want the same question set for a particular session
 */
export function generateSeededQuestionSet(
  seed: string,
  shortCount: number = 3,
  directLongCount: number = 4,
  indirectLongCount: number = 4
): QuestionSet {
  // Simple seeded random number generator
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNum = ((seedNum << 5) - seedNum) + seed.charCodeAt(i);
    seedNum = seedNum & seedNum;
  }

  const seededRandom = () => {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  };

  const seededSelect = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => seededRandom() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  };

  return {
    requiredShort: QUESTION_POOLS.requiredShort, // Always include Full Name
    short: seededSelect(QUESTION_POOLS.short, shortCount),
    directLong: seededSelect(QUESTION_POOLS.directLong, directLongCount),
    indirectLong: seededSelect(QUESTION_POOLS.indirectLong, indirectLongCount),
    transcription: seededSelect(QUESTION_POOLS.transcription, 1) as TranscriptionQuestion[], // Select 1 random transcription
  };
}