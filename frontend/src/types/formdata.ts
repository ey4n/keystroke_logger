// Dynamic form data type that can accommodate any question from the pools
export type FormData = {
  [key: string]: string;
};

// Helper to create initial form data from a question set
export function createInitialFormData(questionIds: string[]): FormData {
  const formData: FormData = {};
  questionIds.forEach(id => {
    formData[id] = '';
  });
  return formData;
}

// Original initialFormData for backward compatibility
export const initialFormData: FormData = {
  fullName: '',
  email: '',
  age: '',
  occupation: '',
  morningRoutine: '',
  favoriteMemory: '',
  weekendActivity: '',
  calmExperience: '',
  stressfulSituation: '',
  idealHoliday: '',
  fiveYearsFromNow: '',
  taskTracking: '',
  unexpectedChanges: '',
  recentLearning: '',
  decisionMaking: '',
  explainingTasks: '',
  transcription: '',
};