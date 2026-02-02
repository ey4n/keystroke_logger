import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { FormData, createInitialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { generateQuestionSet, QuestionSet } from '../../types/questionpool';

interface MultitaskingTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
  }) => void;
}

interface Challenge {
  id: number;
  type: 'math' | 'stroop';
  question: string;
  correctAnswer: string;
  options?: string[];
  colorWord?: string;
  inkColor?: string;
}

interface ChallengeResult {
  challengeId: number;
  type: 'math' | 'stroop';
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeToAnswer: number;
  timedOut: boolean;
}

// ---- Pace/limits (edit these to make it faster/slower) -----------------
const PACE = {
  minDelayMs: 8000,      // 8s minimum between challenges
  maxDelayMs: 14000,     // up to 14s
  perChallengeSecs: 10,  // give 10s to answer
  maxChallenges: 100,     // allow max 10 challenges
} as const;
// -----------------------------------------------------------------------

const normalize = (s: string) => s.trim().toLowerCase();

export function MultitaskingTest({ sessionId, onTestDataUpdate }: MultitaskingTestProps) {
  // Generate random question set once when component mounts
  const questionSet: QuestionSet = useMemo(() => {
    return generateQuestionSet(3, 4, 4); // 4 short, 4 direct long, 4 indirect long
  }, []);

  // Get all question IDs for form initialization
  const allQuestionIds = useMemo(() => {
    return [
      ...questionSet.requiredShort.map(q => q.id),
      ...questionSet.short.map(q => q.id),
      ...questionSet.directLong.map(q => q.id),
      ...questionSet.indirectLong.map(q => q.id),
      ...questionSet.transcription.map(q => q.id),
    ];
  }, [questionSet]);

  const [formData, setFormData] = useState<FormData>(() => 
    createInitialFormData(allQuestionIds)
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [challengeTimer, setChallengeTimer] = useState<number>(PACE.perChallengeSecs);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [challengeResults, setChallengeResults] = useState<ChallengeResult[]>([]);
  const [challengeStartTime, setChallengeStartTime] = useState<number | null>(null);

  const challengeTimerRef = useRef<number | null>(null);
  const nextChallengeTimerRef = useRef<number | null>(null);
  const challengesShownRef = useRef(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    logKeyDown, logKeyUp,
    setFieldName, setActiveChallenge,
    clearLogs, getLogs, getAnalytics,
  } = useKeystrokeLogger();

  // Calculate completion percentage
  const totalFields = allQuestionIds.length;
  const filledFields = allQuestionIds.filter(id => formData[id]?.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Calculate challenge statistics
  const correctChallenges = challengeResults.filter(r => r.isCorrect).length;
  const timedOutChallenges = challengeResults.filter(r => r.timedOut).length;
  const wrongChallenges = challengeResults.filter(r => !r.isCorrect).length;
  const avgResponseTime = challengeResults.length > 0
    ? Math.round(challengeResults.reduce((sum, r) => sum + r.timeToAnswer, 0) / challengeResults.length)
    : 0;

  // Form complete only when every field is filled; score: 100 only when complete, -5 per wrong challenge
  const formComplete = filledFields === totalFields && totalFields > 0;
  const baseScore = formComplete ? 100 : 0;
  const score = Math.max(0, baseScore - wrongChallenges * 5);

  // When user clicks "Save to Supabase", stop all challenges immediately
  useEffect(() => {
    const handleSaveClicked = () => {
      setTestCompleted(true);
      if (nextChallengeTimerRef.current) {
        clearTimeout(nextChallengeTimerRef.current);
        nextChallengeTimerRef.current = null;
      }
      if (challengeTimerRef.current) {
        clearTimeout(challengeTimerRef.current);
        challengeTimerRef.current = null;
      }
      setCurrentChallenge(null);
      setActiveChallenge(null);
      setUserAnswer('');
      setAnswerError(null);
      setIsFormDisabled(false);
    };
    window.addEventListener('multitasking-test-save-clicked', handleSaveClicked);
    return () => window.removeEventListener('multitasking-test-save-clicked', handleSaveClicked);
  }, []);

  // Update parent with current data
  useEffect(() => {
    onTestDataUpdate({
      getLogs,
      getAnalytics,
      formData: {
        completionPercentage,
        filledFields,
        totalFields,
        challengesShown: challengesShownRef.current,
        challengesCompleted: correctChallenges,
        challengesTimedOut: timedOutChallenges,
        wrongChallenges,
        averageResponseTime: avgResponseTime,
        challengeResults: challengeResults,
        score,
        formSnapshot: formData,
        questionSet: questionSet,
      }
    });
  }, [formData, completedChallenges, challengeResults, completionPercentage, score]);

  // Generate challenges
  const generateChallenge = (): Challenge => {
    const challengeId = Date.now();
    const isMath = Math.random() > 0.5;

    if (isMath) {
      const operations = [
        { q: '13 + 17 × 2', a: '47' },
        { q: '8 × 9 - 15', a: '57' },
        { q: '100 ÷ 4 + 6', a: '31' },
        { q: '45 - 12 ÷ 3', a: '41' },
        { q: '7 × 6 + 8', a: '50' },
        { q: '64 ÷ 8 × 5', a: '40' },
        { q: '25 + 15 - 9', a: '31' },
        { q: '12 × 3 - 7', a: '29' },
        { q: '15 + 6 × 4', a: '39' },
        { q: '20 - 3 × 5', a: '5' },
        { q: '9 × 3 + 14', a: '41' },
        { q: '11 × 4 - 9', a: '35' },
        { q: '18 + 7 × 3', a: '39' },
        { q: '50 - 8 × 4', a: '18' },
        { q: '6 × 7 - 12', a: '30' },
        { q: '35 + 5 × 6', a: '65' },
        { q: '5 × 8 ÷ 2', a: '20' },
        { q: '6 × 9 ÷ 3', a: '18' },
        { q: '7 × 4 ÷ 2', a: '14' },
        { q: '8 × 7 ÷ 4', a: '14' },
        { q: '9 × 6 ÷ 3', a: '18' },
        { q: '4 × 12 ÷ 6', a: '8' }
      ];
      const op = operations[Math.floor(Math.random() * operations.length)];
      return {
        id: challengeId,
        type: 'math',
        question: `Solve: ${op.q} = ?`,
        correctAnswer: op.a,
      };
    } else {
      const stroopCombos = [
        { word: 'RED',    ink: 'blue',   answer: 'Blue' },
        { word: 'BLUE',   ink: 'red',    answer: 'Red' },
        { word: 'GREEN',  ink: 'yellow', answer: 'Yellow' },
        { word: 'YELLOW', ink: 'green',  answer: 'Green' },
        { word: 'PURPLE', ink: 'orange', answer: 'Orange' },
        { word: 'ORANGE', ink: 'purple', answer: 'Purple' },
        { word: 'GREEN',  ink: 'red',    answer: 'Red' },
        { word: 'YELLOW', ink: 'red',    answer: 'Red' },
        { word: 'PURPLE', ink: 'red',    answer: 'Red' },
        { word: 'ORANGE', ink: 'red',    answer: 'Red' },
        { word: 'RED',    ink: 'blue',   answer: 'Blue' },
        { word: 'GREEN',  ink: 'blue',   answer: 'Blue' },
        { word: 'YELLOW', ink: 'blue',   answer: 'Blue' },
        { word: 'ORANGE', ink: 'blue',   answer: 'Blue' },
        { word: 'RED',    ink: 'green',  answer: 'Green' },
        { word: 'BLUE',   ink: 'green',  answer: 'Green' },
        { word: 'PURPLE', ink: 'green',  answer: 'Green' },
        { word: 'ORANGE', ink: 'green',  answer: 'Green' },
        { word: 'RED',    ink: 'yellow', answer: 'Yellow' },
        { word: 'BLUE',   ink: 'yellow', answer: 'Yellow' },
        { word: 'PURPLE', ink: 'yellow', answer: 'Yellow' },
        { word: 'ORANGE', ink: 'yellow', answer: 'Yellow' },
        { word: 'RED',    ink: 'purple', answer: 'Purple' },
        { word: 'BLUE',   ink: 'purple', answer: 'Purple' },
        { word: 'GREEN',  ink: 'purple', answer: 'Purple' },
        { word: 'YELLOW', ink: 'purple', answer: 'Purple' },
        { word: 'RED',    ink: 'orange', answer: 'Orange' },
        { word: 'BLUE',   ink: 'orange', answer: 'Orange' },
        { word: 'GREEN',  ink: 'orange', answer: 'Orange' },
        { word: 'YELLOW', ink: 'orange', answer: 'Orange' },
      ];
      const combo = stroopCombos[Math.floor(Math.random() * stroopCombos.length)];
      return {
        id: challengeId,
        type: 'stroop',
        question: 'Select the ink color (not the word):',
        colorWord: combo.word,
        inkColor: combo.ink,
        correctAnswer: combo.answer,
        options: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'],
      };
    }
  };

  // Schedule next challenge
  const scheduleNextChallenge = () => {
    if (testCompleted || challengesShownRef.current >= PACE.maxChallenges) return;

    const delay = PACE.minDelayMs + Math.random() * (PACE.maxDelayMs - PACE.minDelayMs);
    nextChallengeTimerRef.current = window.setTimeout(() => {
      if (testCompleted) return;
      const challenge = generateChallenge();
      setCurrentChallenge(challenge);
      setActiveChallenge(challenge.id);
      setChallengeTimer(PACE.perChallengeSecs);
      setChallengeStartTime(Date.now());
      setAnswerError(null);
      setIsFormDisabled(true);
      challengesShownRef.current += 1;
    }, delay);
  };

  // Challenge timer countdown (don't run when test is completed)
  useEffect(() => {
    if (testCompleted) return;
    if (currentChallenge && challengeTimer > 0) {
      challengeTimerRef.current = window.setTimeout(() => {
        setChallengeTimer(prev => prev - 1);
      }, 1000);
    } else if (currentChallenge && challengeTimer === 0) {
      handleChallengeTimeout();
    }

    return () => {
      if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    };
  }, [testCompleted, currentChallenge, challengeTimer]);

  const handleChallengeTimeout = () => {
    if (currentChallenge && challengeStartTime) {
      // Record timeout result
      const result: ChallengeResult = {
        challengeId: currentChallenge.id,
        type: currentChallenge.type,
        question: currentChallenge.question,
        userAnswer: userAnswer || '(no answer)',
        correctAnswer: currentChallenge.correctAnswer,
        isCorrect: false,
        timeToAnswer: Date.now() - challengeStartTime,
        timedOut: true,
      };
      setChallengeResults(prev => [...prev, result]);
    }

    setAnswerError('⏰ Time expired! Moving on...');
    setTimeout(() => {
      setCurrentChallenge(null);
      setActiveChallenge(null);
      setUserAnswer('');
      setAnswerError(null);
      setIsFormDisabled(false);
      setChallengeStartTime(null);
      scheduleNextChallenge();
    }, 1500);
  };

const handleChallengeSubmit = () => {
    if (!currentChallenge || !challengeStartTime || isSubmitting) return;
    
    const isCorrect = normalize(userAnswer) === normalize(currentChallenge.correctAnswer);
    
    if (!isCorrect) {
      setIsSubmitting(true); 
      // Record wrong answer immediately
      const wrongResult: ChallengeResult = {
        challengeId: currentChallenge.id,
        type: currentChallenge.type,
        question: currentChallenge.question,
        userAnswer: userAnswer || '(no answer)',
        correctAnswer: currentChallenge.correctAnswer,
        isCorrect: false,
        timeToAnswer: Date.now() - challengeStartTime,
        timedOut: false, 
      };
      setChallengeResults(prev => [...prev, wrongResult]);
      
      // Show immediate feedback with correct answer
      setAnswerError(`❌ Incorrect! The correct answer was: ${currentChallenge.correctAnswer}`);
      
      // Close modal and move on after brief display
      setTimeout(() => {
        setCurrentChallenge(null);
        setActiveChallenge(null);
        setUserAnswer('');
        setAnswerError(null);
        setIsFormDisabled(false);
        setChallengeStartTime(null);
        scheduleNextChallenge();
        setIsSubmitting(false); 
      }, 2000); // Show for 2 seconds
      return;
    }
    // Record successful result
    setIsSubmitting(true);
    const result: ChallengeResult = {
      challengeId: currentChallenge.id,
      type: currentChallenge.type,
      question: currentChallenge.question,
      userAnswer: userAnswer,
      correctAnswer: currentChallenge.correctAnswer,
      isCorrect: true,
      timeToAnswer: Date.now() - challengeStartTime,
      timedOut: false,
    };
    setChallengeResults(prev => [...prev, result]);

    setCompletedChallenges(prev => prev + 1);
    setCurrentChallenge(null);
    setActiveChallenge(null);
    setUserAnswer('');
    setAnswerError(null);
    setIsFormDisabled(false);
    setChallengeStartTime(null);
    scheduleNextChallenge();
    setIsSubmitting(false);
  };

  const handleOptionClick = (option: string) => {
    setUserAnswer(option);
    if (answerError) setAnswerError(null);
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (isFormDisabled) return;
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    if (!hasStarted) {
      setHasStarted(true);
      scheduleNextChallenge();
    }
  };

  const handleFieldFocus = (fieldName: keyof FormData) => {
    if (setFieldName) setFieldName(String(fieldName));
  };

  const handleFieldBlur = () => {
    if (setFieldName) setFieldName(undefined);
  };

  return (
    <div className="relative">
      {/* Points Bar - score only meaningful after form complete */}
      <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg border-4 border-purple-300 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium mb-1">Your Score</div>
            <div className="text-white text-5xl font-bold">{formComplete ? score : '—'}</div>
            <div className="text-purple-100 text-xs mt-1">
              {formComplete ? `Form complete: 100 pts • -5 per wrong challenge` : `Complete all fields to see your score (${filledFields}/${totalFields})`}
              {formComplete && wrongChallenges > 0 && (
                <span className="ml-2">• {wrongChallenges} wrong (-{wrongChallenges * 5} pts)</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-purple-100 text-xs">
              {formComplete ? (score >= 90 ? 'Great!' : score >= 70 ? 'Good!' : score >= 50 ? 'Keep going!' : 'Focus on challenges!') : 'Score after form complete'}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-purple-300/30 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${formComplete ? score : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
        <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
        <p className="text-sm text-gray-700 mb-2">
          Fill out the form while handling interruptions! Random challenges will appear that you must solve quickly.
        </p>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• <strong>Math challenges:</strong> Solve in {PACE.perChallengeSecs}s</div>
          <div>• <strong>Stroop tests:</strong> Select the ink color, not the word</div>
          <div>• Challenges completed: <strong>{correctChallenges}</strong> (Challenges failed {wrongChallenges})</div>
        </div>
        <div className="mt-3 bg-white p-3 rounded border border-purple-200">
          <p className="text-sm font-semibold text-gray-800 mb-1">📊 Scoring System:</p>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li>Complete the form to earn <strong>100 points</strong></li>
            <li>You lose <strong>5 points</strong> for each challenge you get wrong (incorrect or timed out)</li>
            <li>Your score is only displayed <strong>after you complete the form</strong></li>
          </ul>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Form Progress: <strong>{completionPercentage}% Complete</strong> ({filledFields}/{totalFields} fields)
        </div>
      </div>

      {/* Challenge Modal */}
      {currentChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold mb-2 ${
                challengeTimer <= 3 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {challengeTimer}s
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                ⚡ Quick Challenge!
              </h3>
            </div>

            {currentChallenge.type === 'math' ? (
              <div>
                <p className="text-center text-xl font-semibold text-gray-800 mb-4">
                  {currentChallenge.question}
                </p>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => {
                    setUserAnswer(e.target.value);
                    if (answerError) setAnswerError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleChallengeSubmit();
                  }}
                  className={`w-full p-3 border-2 rounded-lg text-center text-xl font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none ${
                    answerError ? 'border-red-500' : 'border-indigo-300'
                  }`}
                  placeholder="Type answer"
                  autoFocus
                />
                {answerError && (
                  <div className="mt-2 text-sm text-red-600 text-center">{answerError}</div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-center text-sm text-gray-700 mb-3">
                  {currentChallenge.question}
                </p>
                <div
                  className="text-center text-5xl font-bold mb-4 py-3"
                  style={{ color: currentChallenge.inkColor }}
                >
                  {currentChallenge.colorWord}
                </div>
                <div className={`grid grid-cols-2 gap-2 ${answerError ? 'ring-2 ring-red-400 rounded-lg p-1' : ''}`}>
                  {currentChallenge.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={`p-3 rounded-lg font-semibold text-gray-800 transition-colors ${
                        userAnswer === option
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-indigo-100 hover:bg-indigo-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {answerError && (
                  <div className="mt-2 text-sm text-red-600 text-center">{answerError}</div>
                )}
              </div>
            )}

            <button
              onClick={handleChallengeSubmit}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Submit & Continue
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <DataCollectionForm
        formData={formData}
        questions={questionSet}
        onInputChange={handleInputChange}
        onKeyDown={logKeyDown}
        onKeyUp={logKeyUp}
        onFieldFocus={handleFieldFocus}
        onFieldBlur={handleFieldBlur}
        disabled={isFormDisabled}
        className={`max-h-[500px] overflow-y-auto pr-2 mb-6 transition-opacity ${
          isFormDisabled ? 'opacity-50' : 'opacity-100'
        }`}
      />
    </div>
  );
}