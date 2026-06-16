import mongoose from 'mongoose';
import Word from '../models/word';
import { LearningLevel, StepRange } from '../types/common';
import { WindowConfig, DeckWindow, WindowCheckpoint } from '../types/services/slidingWindow';

// Re-export types for backwards compatibility
export type { WindowConfig, DeckWindow, WindowCheckpoint };

export class SlidingWindowService {
  private static readonly DEFAULT_CONFIG: WindowConfig = {
    windowSize: 3,
    maxStep: 10,
    minStep: 1,
  };

  /**
   * Generate all possible sliding windows for a level
   */
  static generateAllWindows(level: LearningLevel, config: WindowConfig = this.DEFAULT_CONFIG): StepRange[] {
    const windows: StepRange[] = [];
    const { windowSize, maxStep, minStep } = config;

    // Generate standard sliding windows (1-3, 2-4, 3-5, ..., 8-10)
    for (let start = minStep; start <= maxStep - windowSize + 1; start++) {
      const end = start + windowSize - 1;
      windows.push({ start, end });
    }

    // Generate circular review windows for level-end wraparound
    // 9-1 (steps 9, 10, 1), 10-2 (steps 10, 1, 2)
    if (maxStep >= windowSize) {
      for (let offset = 1; offset < windowSize; offset++) {
        const circularStart = maxStep - windowSize + 1 + offset;
        const circularEnd = offset;

        // Only add if it creates a valid circular window
        if (circularStart <= maxStep) {
          windows.push({
            start: circularStart,
            end: circularEnd,
          });
        }
      }
    }

    return windows;
  }

  /**
   * Get the next sliding window based on current position
   */
  static async getNextWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config?: Partial<WindowConfig>
  ): Promise<StepRange | null> {
    // 1. DB에서 실제 maxStep 조회
    const Word = mongoose.model('Word');
    const maxStepResult = await Word.aggregate([
      { $match: { level: level } },
      { $group: { _id: null, maxStep: { $max: '$step' } } },
    ]);
    const maxStep = maxStepResult.length > 0 ? maxStepResult[0].maxStep : 10;

    // 2. config 병합
    const finalConfig = {
      ...this.DEFAULT_CONFIG,
      ...config,
      maxStep: maxStep, // 👈 DB 조회값이 최우선
    };

    // 3. 기존 로직
    const allWindows = this.generateAllWindows(level, finalConfig);

    const currentIndex = allWindows.findIndex(
      (window) => window.start === currentSteps.start && window.end === currentSteps.end
    );

    if (currentIndex === -1 || currentIndex >= allWindows.length - 1) {
      return null;
    }

    return allWindows[currentIndex + 1];
  }

  /**
   * Check if a window is circular (wraps around from high to low steps)
   */
  static isCircularWindow(steps: StepRange, _config: WindowConfig = this.DEFAULT_CONFIG): boolean {
    return steps.start > steps.end;
  }

  /**
   * Get step numbers for a window (handles circular windows)
   */
  static getWindowSteps(steps: StepRange, config: WindowConfig = this.DEFAULT_CONFIG): number[] {
    const { maxStep, minStep } = config;

    if (this.isCircularWindow(steps)) {
      // Circular window: e.g., 9-1 becomes [9, 10, 1]
      const result: number[] = [];

      // Add steps from start to maxStep
      for (let step = steps.start; step <= maxStep; step++) {
        result.push(step);
      }

      // Add steps from minStep to end
      for (let step = minStep; step <= steps.end; step++) {
        result.push(step);
      }

      return result;
    } else {
      // Normal window: e.g., 2-4 becomes [2, 3, 4]
      const result: number[] = [];
      for (let step = steps.start; step <= steps.end; step++) {
        result.push(step);
      }
      return result;
    }
  }

  /**
   * Generate a deck of words for a specific window
   */
  static async generateDeck(
    level: LearningLevel,
    steps: StepRange,
    shuffled: boolean = true,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<DeckWindow> {
    const windowSteps = this.getWindowSteps(steps, config);
    const allWindows = this.generateAllWindows(level, config);
    const windowIndex = allWindows.findIndex((window) => window.start === steps.start && window.end === steps.end);

    // Fetch words for the window steps
    const words = await Word.find({
      level: level,
      step: { $in: windowSteps },
    }).sort({ step: 1, kanji: 1 });

    let wordIds = words.map((word) => word._id);

    // Shuffle if requested
    if (shuffled) {
      wordIds = this.shuffleArray([...wordIds]);
    }

    return {
      level,
      steps,
      wordIds,
      windowIndex,
      isCircular: this.isCircularWindow(steps, config),
      totalWindows: allWindows.length,
    };
  }

  /**
   * Validate if a step range is valid for the given level
   */
  static async validateStepRange(
    level: LearningLevel,
    steps: StepRange,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<boolean> {
    const windowSteps = this.getWindowSteps(steps, config);

    // Check if any words exist for these steps
    const wordCount = await Word.countDocuments({
      level: level,
      step: { $in: windowSteps },
    });

    return wordCount > 0;
  }

  /**
   * Get available step ranges for a level
   */
  static async getAvailableWindows(
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<StepRange[]> {
    const allWindows = this.generateAllWindows(level, config);
    const validWindows: StepRange[] = [];

    for (const window of allWindows) {
      const isValid = await this.validateStepRange(level, window, config);
      if (isValid) {
        validWindows.push(window);
      }
    }

    return validWindows;
  }

  /**
   * Calculate progress percentage for current window position
   */
  static calculateWindowProgress(
    currentWindow: StepRange,
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): number {
    const allWindows = this.generateAllWindows(level, config);
    const currentIndex = allWindows.findIndex(
      (window) => window.start === currentWindow.start && window.end === currentWindow.end
    );

    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / allWindows.length) * 100);
  }

  static async canMoveToNextWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<boolean> {
    const nextWindow = await this.getNextWindow(currentSteps, level, config);
    return nextWindow !== null;
  }

  /**
   * Shuffle array utility (Fisher-Yates algorithm)
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

}

export default SlidingWindowService;
