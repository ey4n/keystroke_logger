import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { useActiveTypingTimer } from '../../hooks/useActiveTypingTimer';
import { FormData, createInitialFormData } from '../../types/formdata';
import { ShortInputField } from '../forms/FormFields';
import { generateQuestionSet, QuestionSet, Question, TranscriptionQuestion } from '../../types/questionpool';

const LONG_QUESTION_MAX_CHARS = 150;

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
  stroopMode?: 'ink' | 'word'; 
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

  const allLongQuestions: Question[] = useMemo(() => {
    return [...questionSet.directLong, ...questionSet.indirectLong];
  }, [questionSet]);

  type Step = 'personal' | number | 'transcription' | 'complete';
  const [step, setStep] = useState<Step>('personal');
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(true);

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
      // Randomly decide whether to ask for ink color or word
      const askForInk = Math.random() > 0.5;
      
      const stroopCombos = [
        { word: 'RED',    ink: 'blue',   inkAnswer: 'Blue',   wordAnswer: 'Red' },
        { word: 'BLUE',   ink: 'red',    inkAnswer: 'Red',    wordAnswer: 'Blue' },
        { word: 'GREEN',  ink: 'yellow', inkAnswer: 'Yellow', wordAnswer: 'Green' },
        { word: 'YELLOW', ink: 'green',  inkAnswer: 'Green',  wordAnswer: 'Yellow' },
        { word: 'PURPLE', ink: 'orange', inkAnswer: 'Orange', wordAnswer: 'Purple' },
        { word: 'ORANGE', ink: 'purple', inkAnswer: 'Purple', wordAnswer: 'Orange' },
        { word: 'GREEN',  ink: 'red',    inkAnswer: 'Red',    wordAnswer: 'Green' },
        { word: 'YELLOW', ink: 'red',    inkAnswer: 'Red',    wordAnswer: 'Yellow' },
        { word: 'RED',    ink: 'green',  inkAnswer: 'Green',  wordAnswer: 'Red' },
        { word: 'BLUE',   ink: 'yellow', inkAnswer: 'Yellow', wordAnswer: 'Blue' },
      ];
      const chosen = stroopCombos[Math.floor(Math.random() * stroopCombos.length)];
      
      // All possible colors for options
      const allColors = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'];
      
      // Determine correct answer and generate options based on mode
      const correctAnswer = askForInk ? chosen.inkAnswer : chosen.wordAnswer;
      const wrongOptions = allColors.filter(c => c !== correctAnswer);
      const shuffled = [
        correctAnswer,
        ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
      ].sort(() => Math.random() - 0.5);

      return {
        id: challengeId,
        type: 'stroop',
        question: askForInk 
          ? 'What color is the INK? (Not the word itself)'
          : 'What WORD is written? (Ignore the ink color)',
        correctAnswer: correctAnswer,
        colorWord: chosen.word,
        inkColor: chosen.ink,
        options: shuffled,
        stroopMode: askForInk ? 'ink' : 'word',
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
    typingTimer.recordKeystroke();
    if (hasStarted && typingTimer.isPaused && !currentChallenge) {
      typingTimer.resumeTimer();
    }
  };

  const goNext = () => {
    if (step === 'personal') {
      setStep(0);
      return;
    }
    if (typeof step === 'number') {
      if (step + 1 < allLongQuestions.length) setStep(step + 1);
      else setStep('transcription');
      return;
    }
    if (step === 'transcription') setStep('complete');
  };

  const goBack = () => {
    if (typeof step === 'number') {
      if (step === 0) setStep('personal');
      else setStep(step - 1);
      return;
    }
    if (step === 'transcription') setStep(allLongQuestions.length - 1);
    if (step === 'complete') setStep('transcription');
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

      {/* Stepped form: Personal → Long questions → Transcription → Complete */}
      {step === 'personal' && (
        <>
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
            {formComplete ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                <p className="text-sm font-semibold text-green-800 mb-1">🎉 Form Complete!</p>
                <p className="text-xs text-green-700">
                  All fields filled! No more challenges will appear. Click &quot;End Test&quot; to finish — you&apos;ll complete a short post-task questionnaire and your responses will then be saved automatically.
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
              Progress: <strong>{completionPercentage}% Complete</strong> ({filledFields}/{totalFields} fields)
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Details</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>KEYSTROKES RECORDING</span>
            </div>
          </div>
          <div className={`space-y-6 mb-6 transition-opacity ${isFormDisabled ? 'opacity-50' : 'opacity-100'}`}>
            {[...questionSet.requiredShort, ...questionSet.short].map((q) => (
              <ShortInputField
                key={q.id}
                label={q.label}
                value={formData[q.id] || ''}
                onChange={handleInputChange(q.id)}
                onKeyDown={handleKeyDown}
                onKeyUp={logKeyUp as any}
                onBeforeInput={logInputFallback}
                onFocus={() => handleFieldFocus(q.id)}
                onBlur={handleFieldBlur}
                disabled={isFormDisabled}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNext}
              disabled={isFormDisabled}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </>
      )}

      {typeof step === 'number' && allLongQuestions[step] && (() => {
        const q = allLongQuestions[step];
        const value = formData[q.id] || '';
        const isDirectLong = step < questionSet.directLong.length;
        const sectionTitle = isDirectLong ? 'Tell Us About Yourself' : 'Reflections & Insights';
        return (
          <div className={`min-h-[360px] flex flex-col bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mb-6 transition-opacity ${isFormDisabled ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sectionTitle}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>KEYSTROKES RECORDING</span>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{q.label}</h2>
            <p className="text-sm text-gray-500 italic mb-4">Write at least 2 sentences.</p>
            <textarea
              value={value}
              onChange={handleInputChange(q.id)}
              onKeyDown={handleKeyDown}
              onKeyUp={logKeyUp as any}
              onBeforeInput={logInputFallback ? (e) => {
                const n = e.nativeEvent as InputEvent;
                logInputFallback({ data: n.data, inputType: n.inputType });
              } : undefined}
              onFocus={() => handleFieldFocus(q.id)}
              maxLength={LONG_QUESTION_MAX_CHARS}
              placeholder="Start typing here..."
              rows={5}
              disabled={isFormDisabled}
              className="w-full min-h-[160px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
            />
            <div className="mt-2 text-center text-sm text-gray-500">
              <span className="text-purple-600 font-medium">{value.length}</span>
              <span> / {LONG_QUESTION_MAX_CHARS} characters</span>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <button type="button" onClick={goBack} disabled={isFormDisabled} className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                Back
              </button>
              <button type="button" onClick={goNext} disabled={isFormDisabled} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        );
      })()}

      {step === 'transcription' && questionSet.transcription.length > 0 && (() => {
        const t = questionSet.transcription[0] as TranscriptionQuestion;
        const value = formData[t.id] || '';
        return (
          <div className={`min-h-[360px] flex flex-col mb-6 transition-opacity ${isFormDisabled ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transcription Task</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>KEYSTROKES RECORDING</span>
              </div>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <button type="button" onClick={() => setTranscriptionExpanded(!transcriptionExpanded)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-semibold text-gray-800">
                  {transcriptionExpanded ? '▼ Reference paragraph (click to collapse)' : '▶ Reference paragraph (click to show)'}
                </span>
              </button>
              {transcriptionExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">{t.instructions}</p>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed font-mono">&quot;{t.paragraph}&quot;</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.label}</h2>
              <textarea
                value={value}
                onChange={handleInputChange(t.id)}
                onKeyDown={handleKeyDown}
                onKeyUp={logKeyUp as any}
                onBeforeInput={logInputFallback ? (e) => { const n = e.nativeEvent as InputEvent; logInputFallback({ data: n.data, inputType: n.inputType }); } : undefined}
                onFocus={() => handleFieldFocus(t.id)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                placeholder="Type the paragraph here..."
                rows={5}
                disabled={isFormDisabled}
                className="w-full min-h-[160px] px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all resize-y"
              />
              <div className="mt-2 text-center text-sm text-gray-500">
                <span className="text-purple-600 font-medium">{value.length}</span>
                <span> / {t.paragraph.length} characters</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <button type="button" onClick={goBack} disabled={isFormDisabled} className="px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                Back
              </button>
              <button type="button" onClick={goNext} disabled={isFormDisabled} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          </div>
        );
      })()}

      {step === 'complete' && (
        <div className="min-h-[240px] flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re done!</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Click &quot;End Test&quot; to submit your responses.
          </p>
          <button type="button" onClick={goBack} className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
            Back
          </button>
        </div>
      )}

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
    </div>
  );
}