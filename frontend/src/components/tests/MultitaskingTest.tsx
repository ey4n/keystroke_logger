// components/tests/MultitaskingTest.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';

interface MultitaskingTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

interface FormData {
  fullName: string;
  email: string;
  age: string;
  occupation: string;
  morningRoutine: string;
  favoriteMemory: string;
  weekendActivity: string;
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

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-md font-semibold text-gray-700 mb-3">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const ShortInputField = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  disabled
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      disabled={disabled}
      className={`w-full p-2 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${
        disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
      }`}
    />
  </div>
);

const LongTextArea = ({ 
  label, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  disabled
}: { 
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      disabled={disabled}
      rows={3}
      className={`w-full p-2 border-2 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none ${
        disabled ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
      }`}
    />
  </div>
);

export function MultitaskingTest({ onShowData, onClearData, showData }: MultitaskingTestProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', age: '', occupation: '',
    morningRoutine: '', favoriteMemory: '', weekendActivity: '',
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [challengeTimer, setChallengeTimer] = useState(8);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  
  const challengeTimerRef = useRef<number | null>(null);
  const nextChallengeTimerRef = useRef<number | null>(null);
  const challengesShownRef = useRef(0);

  const { logKeyDown, logKeyUp, clearLogs, getLogs, getAnalytics, exportAsJSON, exportAsCSV } = useKeystrokeLogger();

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
        { word: 'RED', ink: 'blue', answer: 'Blue' },
        { word: 'BLUE', ink: 'red', answer: 'Red' },
        { word: 'GREEN', ink: 'yellow', answer: 'Yellow' },
        { word: 'YELLOW', ink: 'green', answer: 'Green' },
        { word: 'PURPLE', ink: 'orange', answer: 'Orange' },
        { word: 'ORANGE', ink: 'purple', answer: 'Purple' },
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
    if (challengesShownRef.current >= 3) return;
    
    const delay = 15000 + Math.random() * 10000; // 15-25 seconds
    nextChallengeTimerRef.current = window.setTimeout(() => {
      const challenge = generateChallenge();
      setCurrentChallenge(challenge);
      setChallengeTimer(8);
      setIsFormDisabled(true);
      challengesShownRef.current += 1;
    }, delay);
  };

  // Challenge timer countdown
  useEffect(() => {
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
  }, [currentChallenge, challengeTimer]);

  const handleChallengeTimeout = () => {
    setCurrentChallenge(null);
    setUserAnswer('');
    setIsFormDisabled(false);
    setCompletedChallenges(prev => prev + 1);
    scheduleNextChallenge();
  };

  const handleChallengeSubmit = () => {
    setCurrentChallenge(null);
    setUserAnswer('');
    setIsFormDisabled(false);
    setCompletedChallenges(prev => prev + 1);
    scheduleNextChallenge();
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    if (!hasStarted) {
      setHasStarted(true);
      scheduleNextChallenge();
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '', email: '', age: '', occupation: '',
      morningRoutine: '', favoriteMemory: '', weekendActivity: '',
    });
    setHasStarted(false);
    setCurrentChallenge(null);
    setUserAnswer('');
    setCompletedChallenges(0);
    setIsFormDisabled(false);
    challengesShownRef.current = 0;
    clearLogs();
    
    if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    if (nextChallengeTimerRef.current) clearTimeout(nextChallengeTimerRef.current);
    
    onClearData();
  };

  const totalFields = Object.keys(formData).length;
  const filledFields = Object.values(formData).filter(val => val.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="relative">
      {/* Instructions */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
        <h3 className="font-semibold text-gray-800 mb-2">🧠 Multitasking Challenge</h3>
        <p className="text-sm text-gray-700 mb-2">
          Fill out the form while handling interruptions! Random challenges will appear that you must solve quickly.
        </p>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• <strong>Math challenges:</strong> Solve in 8 seconds</div>
          <div>• <strong>Stroop tests:</strong> Select the ink color, not the word</div>
          <div>• Challenges completed: <strong>{completedChallenges}/3</strong></div>
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
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleChallengeSubmit();
                  }}
                  className="w-full p-3 border-2 border-indigo-300 rounded-lg text-center text-xl font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="Type answer"
                  autoFocus
                />
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
                <div className="grid grid-cols-2 gap-2">
                  {currentChallenge.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setUserAnswer(option);
                        handleChallengeSubmit();
                      }}
                      className="p-3 bg-indigo-100 hover:bg-indigo-200 rounded-lg font-semibold text-gray-800 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
      <div className={`max-h-[500px] overflow-y-auto pr-2 mb-6 transition-opacity ${
        isFormDisabled ? 'opacity-50' : 'opacity-100'
      }`}>
        <FormSection title="Personal Details">
          <ShortInputField
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
          <ShortInputField
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange('email')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
          <ShortInputField
            label="Age"
            value={formData.age}
            onChange={handleInputChange('age')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
          <ShortInputField
            label="Occupation"
            value={formData.occupation}
            onChange={handleInputChange('occupation')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
        </FormSection>

        <FormSection title="Tell Us About Yourself">
          <LongTextArea
            label="Describe your typical morning routine"
            value={formData.morningRoutine}
            onChange={handleInputChange('morningRoutine')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
          <LongTextArea
            label="What's your favorite memory from the past year?"
            value={formData.favoriteMemory}
            onChange={handleInputChange('favoriteMemory')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
          <LongTextArea
            label="How do you typically spend your weekends?"
            value={formData.weekendActivity}
            onChange={handleInputChange('weekendActivity')}
            onKeyDown={logKeyDown as any}
            onKeyUp={logKeyUp as any}
            disabled={isFormDisabled}
          />
        </FormSection>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onShowData}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {showData ? 'Hide Data' : 'Show All Data'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Clear Data
        </button>
      </div>

      {/* Keystroke Data Display */}
      {showData && (
        <KeystrokeDataDisplay 
          events={getLogs()}
          analytics={getAnalytics()}
          onExportJSON={exportAsJSON}
          onExportCSV={exportAsCSV}
        />
      )}
    </div>
  );
}