// Question pools categorized by type
export interface Question {
  id: string;
  label: string;
  type: 'short' | 'direct-long' | 'indirect-long' | 'analytical-long' | 'transcription';
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
    { id: 'gender', label: 'Gender', type: 'short', category: 'personal' },
    { id: 'nativeLanguage', label: 'Mother Tongue', type: 'short', category: 'personal' },
    { id: 'phone', label: 'What phone do you currently own?', type: 'short', category: 'personal' },
    { id: 'dominantHand', label: 'Dominant Hand', type: 'short', category: 'personal' },
    { id: 'fieldOfStudy', label: 'Field of Study or Industry', type: 'short', category: 'personal' },
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
    { id: 'recentMeal', label: 'Describe the last meal you cooked or ate', type: 'direct-long', category: 'reflection' },
    { id: 'favoriteFood', label: 'What is your favorite type of food and why?', type: 'direct-long', category: 'reflection' },
    { id: 'lastVacation', label: 'Describe the last trip or vacation you took.', type: 'direct-long', category: 'reflection' },
    { id: 'typicalEvening', label: 'Describe what you usually do in the evening after work or school.', type: 'direct-long', category: 'reflection' },
    { id: 'favoriteMovie', label: 'Describe a movie or show you recently enjoyed.', type: 'direct-long', category: 'reflection' },
    { id: 'favoriteSeason', label: 'Which season of the year do you enjoy most and why?', type: 'direct-long', category: 'reflection' },
    { id: 'exerciseRoutine', label: 'Describe your typical exercise or physical activity routine.', type: 'direct-long', category: 'reflection' },
    { id: 'favoriteRestaurant', label: 'Describe a restaurant or café you enjoy visiting.', type: 'direct-long', category: 'reflection' },
    { id: 'dailyTransport', label: 'Describe how you usually commute or travel during the day.', type: 'direct-long', category: 'reflection' },
    { id: 'musicPreference', label: 'What kind of music do you enjoy listening to?', type: 'direct-long', category: 'reflection' },
    
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
    { id: 'explainingTasks', label: 'Describe how you would explain a process or task to someone unfamiliar with it.', type: 'indirect-long', category: 'cognitive' },
    { id: 'problemSolving', label: 'Describe your approach when facing a challenging problem.', type: 'indirect-long', category: 'cognitive' },
    { id: 'workLifeBalance', label: 'How do you maintain balance between work and personal life?', type: 'indirect-long', category: 'cognitive' },
    { id: 'conflictResolution', label: 'Describe how you handle disagreements or conflicts with others.', type: 'indirect-long', category: 'cognitive' },
    { id: 'stressManagement', label: 'What strategies do you use to manage stress during busy periods?', type: 'indirect-long', category: 'cognitive' },
    { id: 'difficultDecision', label: 'Describe a difficult decision you had to make recently.', type: 'indirect-long', category: 'cognitive' },
    { id: 'timeManagement', label: 'Explain how you manage your time when you have multiple deadlines.', type: 'indirect-long', category: 'cognitive' },
    { id: 'learningStrategy', label: 'Describe how you usually learn a new skill or concept.', type: 'indirect-long', category: 'cognitive' },
    { id: 'unexpectedProblem', label: 'Describe a time when you encountered an unexpected problem and how you handled it.', type: 'indirect-long', category: 'cognitive' },
    { id: 'teamworkExperience', label: 'Describe a situation where you had to work closely with others to achieve a goal.', type: 'indirect-long', category: 'cognitive' },
    { id: 'motivation', label: 'What usually motivates you to complete challenging tasks?', type: 'indirect-long', category: 'cognitive' },
    { id: 'handlingPressure', label: 'Explain how you typically handle pressure when facing tight deadlines.', type: 'indirect-long', category: 'cognitive' },
    { id: 'learningMistake', label: 'Describe a mistake you made and what you learned from it.', type: 'indirect-long', category: 'cognitive' },
    { id: 'adaptingToChange', label: 'Describe how you adapt when learning a completely new system or technology.', type: 'indirect-long', category: 'cognitive' },
    { id: 'prioritisation', label: 'How do you decide which task to focus on when everything seems important?', type: 'indirect-long', category: 'cognitive' },
    { id: 'problemBreakdown', label: 'When faced with a complex problem, how do you break it down to solve it?', type: 'indirect-long', category: 'cognitive' },
    { id: 'goalSetting', label: 'Describe how you typically set and track your personal goals.', type: 'indirect-long', category: 'cognitive' },
  ] as Question[],

  // Analytical long-answer questions - structured reasoning / higher cognitive load
  analyticalLong: [
    { id: 'technologyFuture', label: 'How do you think technology will change the way people work in the next 10 years?', type: 'analytical-long', category: 'cognitive' },
    { id: 'socialMediaImpact', label: 'Do you think social media has had a positive or negative impact on society? Explain your reasoning.', type: 'analytical-long', category: 'cognitive' },
    { id: 'remoteWork', label: 'Do you think remote work will replace traditional office environments in the future? Why or why not?', type: 'analytical-long', category: 'cognitive' },
    { id: 'aiDecisionMaking', label: 'Should artificial intelligence be allowed to make important decisions in areas like healthcare or finance? Explain your view.', type: 'analytical-long', category: 'cognitive' },
    { id: 'educationFuture', label: 'How do you think education systems should evolve to prepare students for future careers?', type: 'analytical-long', category: 'cognitive' },
    { id: 'automationJobs', label: 'Which types of jobs do you think automation will replace, and which will remain important?', type: 'analytical-long', category: 'cognitive' },
    { id: 'urbanLiving', label: 'What are the biggest challenges cities will face as populations continue to grow?', type: 'analytical-long', category: 'cognitive' },
    { id: 'environmentSolutions', label: 'What are some realistic ways individuals or governments can address environmental issues?', type: 'analytical-long', category: 'cognitive' },
    { id: 'technologyDependence', label: 'Do you think society is becoming too dependent on technology? Why or why not?', type: 'analytical-long', category: 'cognitive' },
    { id: 'innovationDrivers', label: 'What factors do you think drive innovation and new ideas in society?', type: 'analytical-long', category: 'cognitive' },
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
  /** One analytical-long question per test, unique per session across tests (randomised, no repeat in same session) */
  analyticalLong: Question[];
  transcription: TranscriptionQuestion[];
}

const ANALYTICAL_LONG_USED_KEY = 'keystroke_analytical_long_used';

/**
 * Pick one analytical-long question for this test that hasn't been used yet in this session.
 * Stores used question IDs in sessionStorage so Timed/Multitasking/Free each get a different question.
 */
export function getAnalyticalLongForSession(sessionId: string): Question | null {
  if (!sessionId || typeof window === 'undefined') return null;
  const key = `${ANALYTICAL_LONG_USED_KEY}_${sessionId}`;
  let used: string[] = [];
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  const pool = QUESTION_POOLS.analyticalLong;
  const available = pool.filter((q) => !used.includes(q.id));
  const pickFrom = available.length > 0 ? available : pool;
  const shuffled = [...pickFrom].sort(() => Math.random() - 0.5);
  const chosen = shuffled[0];
  if (chosen) {
    const nextUsed = used.includes(chosen.id) ? used : [...used, chosen.id];
    try {
      sessionStorage.setItem(key, JSON.stringify(nextUsed));
    } catch {
      // ignore
    }
    return chosen;
  }
  return null;
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
  indirectLongCount: number = 4,
  sessionId?: string
): QuestionSet {
  const analyticalLong = sessionId ? (() => {
    const q = getAnalyticalLongForSession(sessionId);
    return q ? [q] : [];
  })() : [];
  return {
    requiredShort: QUESTION_POOLS.requiredShort, // Always include Full Name
    short: selectRandomQuestions(QUESTION_POOLS.short, shortCount),
    directLong: selectRandomQuestions(QUESTION_POOLS.directLong, directLongCount),
    indirectLong: selectRandomQuestions(QUESTION_POOLS.indirectLong, indirectLongCount),
    analyticalLong,
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
    analyticalLong: [], // seeded generator does not use session-scoped analytical long
    transcription: seededSelect(QUESTION_POOLS.transcription, 1) as TranscriptionQuestion[], // Select 1 random transcription
  };
}