// TODO(steven): refactor this into purely logging, processing, and also a sending module.

class KeystrokeAnalyzer {
  constructor() {
    this.sessions = [];
    this.currentSession = {
      keyEvents: [],
      startTime: null,
      lastKeyUp: null,
      metrics: {},
    };
  }

  startSession() {
    this.currentSession = {
      keyEvents: [],
      startTime: Date.now(),
      lastKeyUp: null,
      metrics: {},
    };

    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  handleKeyDown(event) {
    const timestamp = Date.now();
    const keyEvent = {
      type: "keydown",
      key: event.key,
      code: event.code,
      timestamp: timestamp,
      sessionTime: timestamp - this.currentSession.startTime,
    };

    // Calculate flight time if previous key was released
    if (
      this.currentSession.lastKeyUp &&
      this.currentSession.keyEvents.length > 0
    ) {
      const flightTime = timestamp - this.currentSession.lastKeyUp;
      keyEvent.flightTime = flightTime;
    }

    this.currentSession.keyEvents.push(keyEvent);
  }

  handleKeyUp(event) {
    const timestamp = Date.now();

    // Find corresponding keydown event
    const keydownEvent = this.findLastKeyDown(event.key);
    const dwellTime = keydownEvent ? timestamp - keydownEvent.timestamp : null;

    const keyEvent = {
      type: "keyup",
      key: event.key,
      code: event.code,
      timestamp: timestamp,
      sessionTime: timestamp - this.currentSession.startTime,
      dwellTime: dwellTime,
    };

    this.currentSession.keyEvents.push(keyEvent);
    this.currentSession.lastKeyUp = timestamp;
  }

  findLastKeyDown(key) {
    for (let i = this.currentSession.keyEvents.length - 1; i >= 0; i--) {
      const event = this.currentSession.keyEvents[i];
      if (event.type === "keydown" && event.key === key) {
        return event;
      }
    }
    return null;
  }

  // METRIC CALCULATIONS

  calculateDwellTimeMetrics() {
    const dwellTimes = this.currentSession.keyEvents
      .filter((event) => event.dwellTime)
      .map((event) => event.dwellTime);

    return {
      average: this.average(dwellTimes),
      stdDev: this.standardDeviation(dwellTimes),
      min: Math.min(...dwellTimes),
      max: Math.max(...dwellTimes),
      distribution: this.createDistribution(dwellTimes, 10), // 10ms bins
    };
  }

  calculateFlightTimeMetrics() {
    const flightTimes = this.currentSession.keyEvents
      .filter((event) => event.flightTime)
      .map((event) => event.flightTime);

    return {
      average: this.average(flightTimes),
      stdDev: this.standardDeviation(flightTimes),
      min: Math.min(...flightTimes),
      max: Math.max(...flightTimes),
    };
  }

  calculateTypingSpeed() {
    const keyEvents = this.currentSession.keyEvents;
    if (keyEvents.length < 2) return 0;

    const sessionDuration =
      (Date.now() - this.currentSession.startTime) / 1000 / 60; // minutes
    const wordCount = this.calculateWordCount();

    return {
      wpm: wordCount / sessionDuration,
      cpm: this.countCharacters() / sessionDuration,
      rawKeystrokesPerMinute: keyEvents.length / sessionDuration,
    };
  }

  calculateErrorMetrics() {
    const events = this.currentSession.keyEvents;
    let backspaceCount = 0;
    let deleteCount = 0;
    let totalKeys = 0;

    events.forEach((event) => {
      if (event.type === "keydown") {
        totalKeys++;
        if (event.key === "Backspace") backspaceCount++;
        if (event.key === "Delete") deleteCount++;
      }
    });

    const effectiveKeys = totalKeys - backspaceCount - deleteCount;

    return {
      backspaceRate: backspaceCount / totalKeys,
      errorRate: (backspaceCount + deleteCount) / totalKeys,
      efficiency: effectiveKeys / totalKeys,
      totalCorrections: backspaceCount + deleteCount,
    };
  }

  calculateRhythmMetrics() {
    const keyPressIntervals = [];
    const keyDowns = this.currentSession.keyEvents.filter(
      (e) => e.type === "keydown"
    );

    for (let i = 1; i < keyDowns.length; i++) {
      const interval = keyDowns[i].timestamp - keyDowns[i - 1].timestamp;
      keyPressIntervals.push(interval);
    }

    const dwellTimes = this.currentSession.keyEvents
      .filter((e) => e.dwellTime)
      .map((e) => e.dwellTime);

    return {
      rhythmConsistency: this.calculateConsistency(keyPressIntervals),
      dwellConsistency: this.calculateConsistency(dwellTimes),
      cadence: this.average(keyPressIntervals),
      burstPatterns: this.analyzeBurstPatterns(keyPressIntervals),
    };
  }

  // HELPER METHODS

  calculateWordCount() {
    // Simple word count based on spaces and punctuation
    const text = this.reconstructTypedText();
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  countCharacters() {
    const text = this.reconstructTypedText();
    return text.replace(/\s/g, "").length;
  }

  reconstructTypedText() {
    let text = "";
    const keyDowns = this.currentSession.keyEvents.filter(
      (e) => e.type === "keydown" && e.key.length === 1
    );

    keyDowns.forEach((event) => {
      text += event.key;
    });

    return text;
  }

  calculateConsistency(values) {
    if (values.length < 2) return 0;
    const avg = this.average(values);
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    return 1 / (1 + Math.sqrt(variance)); // Higher = more consistent
  }

  analyzeBurstPatterns(intervals) {
    const threshold = 1000; // 1 second pause indicates break
    let bursts = [];
    let currentBurst = [];

    intervals.forEach((interval) => {
      if (interval > threshold) {
        if (currentBurst.length > 0) {
          bursts.push(currentBurst);
          currentBurst = [];
        }
      } else {
        currentBurst.push(interval);
      }
    });

    if (currentBurst.length > 0) bursts.push(currentBurst);

    return {
      burstCount: bursts.length,
      averageBurstLength: this.average(bursts.map((b) => b.length)),
      pauseFrequency: bursts.length / (intervals.length / 1000), // pauses per second
    };
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  standardDeviation(arr) {
    const avg = this.average(arr);
    const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  createDistribution(values, binSize) {
    const distribution = {};
    values.forEach((value) => {
      const bin = Math.floor(value / binSize) * binSize;
      distribution[bin] = (distribution[bin] || 0) + 1;
    });
    return distribution;
  }

  // MAIN ANALYSIS METHOD
  analyzeSession() {
    const metrics = {
      timing: {
        dwellTime: this.calculateDwellTimeMetrics(),
        flightTime: this.calculateFlightTimeMetrics(),
      },
      speed: this.calculateTypingSpeed(),
      accuracy: this.calculateErrorMetrics(),
      rhythm: this.calculateRhythmMetrics(),
      sessionInfo: {
        duration: Date.now() - this.currentSession.startTime,
        totalEvents: this.currentSession.keyEvents.length,
        timestamp: new Date().toISOString(),
      },
    };

    this.currentSession.metrics = metrics;
    this.sessions.push({ ...this.currentSession });
    return metrics;
  }
}

// USAGE EXAMPLE
const analyzer = new KeystrokeAnalyzer();

// Start recording
analyzer.startSession();

// After typing session, get comprehensive metrics
setTimeout(() => {
  const results = analyzer.analyzeSession();
  console.log("Keystroke Analysis Results:", results);

  // Stress detection indicators
  const stressIndicators = {
    increasedErrors: results.accuracy.errorRate > 0.1,
    inconsistentRhythm: results.rhythm.rhythmConsistency < 0.3,
    variableDwellTime: results.timing.dwellTime.stdDev > 50,
    frequentPauses: results.rhythm.burstPatterns.pauseFrequency > 2,
  };

  console.log("Potential Stress Indicators:", stressIndicators);
}, 60000); // Analyze after 1 minute
