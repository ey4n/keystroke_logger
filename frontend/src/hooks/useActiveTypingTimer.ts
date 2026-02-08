import { useState, useRef, useCallback } from 'react';

export interface ActiveTypingTimer {
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  recordKeystroke: () => void; // NEW: Call this on every keystroke
  getActiveTime: () => number;
  isActive: boolean;
  isPaused: boolean;
}

/**
 * Usage:
 * 1. Call startTimer() on first keystroke
 * 2. Call recordKeystroke() on EVERY keystroke (keydown events)
 * 3. Call pauseTimer() when popup appears
 * 4. Call resumeTimer() when popup is dismissed
 * 5. Call getActiveTime() to get time from first to last keystroke (excluding pauses)
 */
export function useActiveTypingTimer(): ActiveTypingTimer {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const firstKeystrokeTimeRef = useRef<number | null>(null);
  const lastKeystrokeTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0); // Total time spent paused
  const pauseStartRef = useRef<number | null>(null);

  /**
   * Start the timer (call on first keystroke)
   */
  const startTimer = useCallback(() => {
    if (!isActive) {
      const now = Date.now();
      firstKeystrokeTimeRef.current = now;
      lastKeystrokeTimeRef.current = now;
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;
      setIsActive(true);
      setIsPaused(false);
    }
  }, [isActive]);

  /**
   * Record a keystroke (call on EVERY keydown event)
   * This updates the "last keystroke" timestamp
   */
  const recordKeystroke = useCallback(() => {
    if (isActive && !isPaused) {
      lastKeystrokeTimeRef.current = Date.now();
    }
  }, [isActive, isPaused]);

  /**
   * Pause the timer (call when popup appears)
   */
  const pauseTimer = useCallback(() => {
    if (isActive && !isPaused) {
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isActive, isPaused]);

  /**
   * Resume the timer (call when popup is dismissed)
   */
  const resumeTimer = useCallback(() => {
    if (isActive && isPaused && pauseStartRef.current !== null) {
      // Add the paused duration to total paused time
      const pauseDuration = Date.now() - pauseStartRef.current;
      totalPausedTimeRef.current += pauseDuration;
      pauseStartRef.current = null;
      setIsPaused(false);
    }
  }, [isActive, isPaused]);

  /**
   * Stop the timer (optional - not required for calculating time)
   * This is mainly for state management
   */
  const stopTimer = useCallback(() => {
    if (isActive) {
      // If currently paused, add that pause time
      if (isPaused && pauseStartRef.current !== null) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        totalPausedTimeRef.current += pauseDuration;
        pauseStartRef.current = null;
      }
      
      setIsActive(false);
      setIsPaused(false);
    }
  }, [isActive, isPaused]);

  /**
   * Get the total active typing time in milliseconds
   * This is: (last keystroke time - first keystroke time) - total paused time
   */
  const getActiveTime = useCallback((): number => {
    if (firstKeystrokeTimeRef.current === null || lastKeystrokeTimeRef.current === null) {
      return 0;
    }
    
    // Calculate total time from first to last keystroke
    const totalTime = lastKeystrokeTimeRef.current - firstKeystrokeTimeRef.current;
    
    // Subtract paused time
    let pausedTime = totalPausedTimeRef.current;
    
    // If currently paused, add the current pause duration
    if (isPaused && pauseStartRef.current !== null) {
      pausedTime += Date.now() - pauseStartRef.current;
    }
    
    // Return active time (cannot be negative)
    return Math.max(0, totalTime - pausedTime);
  }, [isPaused]);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    recordKeystroke,
    getActiveTime,
    isActive,
    isPaused,
  };
}