import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { useActiveTypingTimer } from '../../hooks/useActiveTypingTimer';
import { FormData, createInitialFormData } from '../../types/formdata';
import { DataCollectionForm } from '../forms/DataCollectionForm';
import { generateQuestionSet, QuestionSet } from '../../types/questionpool';

interface MultitaskingTestProps {
  sessionId: string;
  onTestDataUpdate: (data: {
    getLogs: () => any[];
    getAnalytics: () => any;
    formData: any;
    getActiveTypingTime: () => number;
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
  maxChallenges: 100,     // allow max 100 challenges
} as const;
// -----------------------------------------------------------------------

const normalize = (s: string) => s.trim().toLowerCase();

export function MultitaskingTest({ sessionId, onTestDataUpdate }: MultitaskingTestProps) {
  // Generate random question set once when component mounts
  const questionSet: QuestionSet = useMemo(() => {
    return generateQuestionSet(3, 4, 4);
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
  const isChallengeActiveRef = useRef(false); // NEW: Track if challenge is currently active

  const {
    logKeyDown, logKeyUp,
    logInputFallback,
    setFieldName, setActiveChallenge,
    clearLogs, getLogs, getAnalytics,
  } = useKeystrokeLogger();

  const typingTimer = useActiveTypingTimer();

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

  // Track when challenges appear/disappear to pause/resume typing timer
  useEffect(() => {
    if (currentChallenge) {
      // Challenge appeared, pause typing timer
      typingTimer.pauseTimer();
    } else if (hasStarted && !testCompleted) {
      // Challenge dismissed and test still active, resume typing timer
      typingTimer.resumeTimer();
    }
  }, [currentChallenge, hasStarted, testCompleted, typingTimer]);

  const stopAllChallenges = useCallback(() => {
    console.log('🛑 Stopping all challenges...');
    
    // Clear next challenge timer
    if (nextChallengeTimerRef.current) {
      clearTimeout(nextChallengeTimerRef.current);
      nextChallengeTimerRef.current = null;
    }
    
    // Clear challenge countdown timer
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
    
    // Dismiss current challenge
    setCurrentChallenge(null);
    setActiveChallenge(null);
    setUserAnswer('');
    setAnswerError(null);
    setIsFormDisabled(false);
    isChallengeActiveRef.current = false;
  }, []);

  useEffect(() => {
    const handleSaveClicked = () => {
      console.log('💾 Save clicked - stopping test');
      setTestCompleted(true);
      typingTimer.stopTimer();
      stopAllChallenges();
    };
    window.addEventListener('multitasking-test-save-clicked', handleSaveClicked);
    return () => window.removeEventListener('multitasking-test-save-clicked', handleSaveClicked);
  }, [typingTimer, stopAllChallenges]);

  // Stop challenges when form is completed
  useEffect(() => {
    if (formComplete && !testCompleted) {
      console.log('✅ Form complete - stopping challenges');
      stopAllChallenges();
    }
  }, [formComplete, testCompleted, stopAllChallenges]);

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
      },
      getActiveTypingTime: typingTimer.getActiveTime,
    });
  }, [formData, completedChallenges, challengeResults, completionPercentage, score, typingTimer.getActiveTime]);

  // Generate challenges
  const generateChallenge = (): Challenge => {
    const challengeId = Date.now();
    const isMath = Math.random() > 0.5;

    if (isMath) {
      const operations = [
        { q: '24 + 8 × 3', a: '48' },
        { q: '40 - 6 × 5', a: '10' },
        { q: '14 × 2 + 18', a: '46' },
        { q: '60 - 9 × 4', a: '24' },
        { q: '19 + 4 × 7', a: '47' },
        { q: '13 × 3 - 11', a: '28' },
        { q: '45 ÷ 5 + 14', a: '23' },
        { q: '60 ÷ 6 - 4', a: '6' },
        { q: '35 ÷ 7 + 19', a: '24' },
        { q: '88 ÷ 8 + 7', a: '18' },
        { q: '54 ÷ 9 + 16', a: '22' },
        { q: '70 ÷ 7 - 6', a: '4' },
        { q: '3 × 16 ÷ 4', a: '12' },
        { q: '5 × 14 ÷ 2', a: '35' },
        { q: '6 × 10 ÷ 5', a: '12' },
        { q: '8 × 9 ÷ 6', a: '12' },
        { q: '7 × 8 ÷ 2', a: '28' },
        { q: '32 - 20 + 15', a: '27' },
        { q: '17 + 9 × 4', a: '53' },
        { q: '72 ÷ 9 + 11', a: '19' },
        { q: '55 - 6 × 8', a: '7' },
        { q: '49 ÷ 7 + 13', a: '20' },
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
        { word: 'RED',    ink: 'green',  answer: 'Green' },
        { word: 'BLUE',   ink: 'yellow', answer: 'Yellow' },
      ];
      const chosen = stroopCombos[Math.floor(Math.random() * stroopCombos.length)];
      const allColors = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'];
      const wrongColors = allColors.filter(c => c !== chosen.answer);
      const shuffled = [
        chosen.answer,
        ...wrongColors.sort(() => Math.random() - 0.5).slice(0, 3)
      ].sort(() => Math.random() - 0.5);

      return {
        id: challengeId,
        type: 'stroop',
        question: 'What color is the INK? (Not the word itself)',
        correctAnswer: chosen.answer,
        colorWord: chosen.word,
        inkColor: chosen.ink,
        options: shuffled,
      };
    }
  };

  const scheduleNextChallenge = () => {
    // FIXED: Don't schedule if test completed, form complete, max reached, OR challenge already active
    if (testCompleted || formComplete || challengesShownRef.current >= PACE.maxChallenges || isChallengeActiveRef.current) {
      return;
    }
    
    const delayMs = Math.random() * (PACE.maxDelayMs - PACE.minDelayMs) + PACE.minDelayMs;
    nextChallengeTimerRef.current = window.setTimeout(() => {
      // FIXED: Double-check before showing challenge
      if (testCompleted || formComplete || isChallengeActiveRef.current) {
        return;
      }
      
      const challenge = generateChallenge();
      isChallengeActiveRef.current = true; // FIXED: Mark challenge as active BEFORE setting state
      setCurrentChallenge(challenge);
      setActiveChallenge(challenge.id);
      setIsFormDisabled(true);
      setChallengeTimer(PACE.perChallengeSecs);
      setChallengeStartTime(Date.now());
      challengesShownRef.current += 1;
      
      challengeTimerRef.current = window.setInterval(() => {
        setChallengeTimer(prev => {
          if (prev <= 1) {
            handleChallengeTimeout(challenge);
            return PACE.perChallengeSecs;
          }
          return prev - 1;
        });
      }, 1000);
    }, delayMs);
  };

  const handleChallengeTimeout = (challenge: Challenge) => {
    // FIXED: Only process if this challenge is still the current one
    if (!isChallengeActiveRef.current) return;
    
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
    
    const result: ChallengeResult = {
      challengeId: challenge.id,
      type: challenge.type,
      question: challenge.question,
      userAnswer: '',
      correctAnswer: challenge.correctAnswer,
      isCorrect: false,
      timeToAnswer: PACE.perChallengeSecs * 1000,
      timedOut: true,
    };
    setChallengeResults(prev => [...prev, result]);
    setCurrentChallenge(null);
    setActiveChallenge(null);
    setUserAnswer('');
    setAnswerError(null);
    setIsFormDisabled(false);
    setChallengeStartTime(null);
    isChallengeActiveRef.current = false; // FIXED: Mark as not active
    
    // FIXED: Only schedule next if test is still running
    if (!testCompleted && !formComplete) {
      scheduleNextChallenge();
    }
  };

  const handleChallengeSubmit = () => {
    if (!currentChallenge || !challengeStartTime) return;
    
    // FIXED: Prevent double submission
    if (isSubmitting) return;
    
    const normalized = normalize(userAnswer);
    const correctNormalized = normalize(currentChallenge.correctAnswer);
    
    if (!normalized) {
      setAnswerError('Please enter an answer before submitting!');
      return;
    }
    if (normalized !== correctNormalized) {
      setAnswerError('Incorrect! Try again or wait for timeout.');
      return;
    }
    
    if (challengeTimerRef.current) {
      clearInterval(challengeTimerRef.current);
      challengeTimerRef.current = null;
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
    isChallengeActiveRef.current = false; // FIXED: Mark as not active
    
    // FIXED: Only schedule next if test is still running
    if (!testCompleted && !formComplete) {
      scheduleNextChallenge();
    }
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
      typingTimer.startTimer();
      scheduleNextChallenge();
    }
  };

  const handleFieldFocus = (fieldName: keyof FormData) => {
    if (setFieldName) setFieldName(String(fieldName));
  };

  const handleFieldBlur = () => {
    if (setFieldName) setFieldName(undefined);
  };

  // Handle key events to track typing activity
  const handleKeyDown = (e: React.KeyboardEvent) => {
    logKeyDown(e as any);
    typingTimer.recordKeystroke(); // Record every keystroke
    
    // Resume typing if it was paused and no challenge is active
    if (hasStarted && typingTimer.isPaused && !currentChallenge) {
      typingTimer.resumeTimer();
    }
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
        
        {formComplete ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
            <p className="text-sm font-semibold text-green-800 mb-1">🎉 Form Complete!</p>
            <p className="text-xs text-green-700">
              All fields filled! No more challenges will appear. Click "Show All Data" below and then "Save to Supabase" to submit.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-2">
              Fill out the form while handling interruptions! Random challenges will appear that you must solve quickly.
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• <strong>Math challenges:</strong> Solve in {PACE.perChallengeSecs}s</div>
              <div>• <strong>Stroop tests:</strong> Select the ink color, not the word</div>
              <div>• Challenges completed: <strong>{correctChallenges}</strong> (Challenges failed {wrongChallenges})</div>
            </div>
          </>
        )}
        
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
      {currentChallenge && !testCompleted && (
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
                  disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      className={`p-3 rounded-lg font-semibold text-gray-800 transition-colors ${
                        userAnswer === option
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-indigo-100 hover:bg-indigo-200'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              disabled={isSubmitting}
              className={`w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <DataCollectionForm
        formData={formData}
        questions={questionSet}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onKeyUp={logKeyUp}
        onBeforeInput={logInputFallback}
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