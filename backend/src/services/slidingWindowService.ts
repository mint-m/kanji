import mongoose from 'mongoose';
import Word from '../models/word';
import { LearningLevel, StepRange, ProgressType } from '../types/common';
import {
  WindowConfig,
  DeckWindow,
  WindowCheckpoint,
} from '../types/services/slidingWindow';

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

    const { windowSize, minStep } = finalConfig;

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
  static isCircularWindow(steps: StepRange, config: WindowConfig = this.DEFAULT_CONFIG): boolean {
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
   * Generate a deck with bookmark-aware prioritization
   * This method creates a deck and pre-applies bookmark prioritization logic
   */
  static async generateDeckWithBookmarkPriority(
    level: LearningLevel,
    steps: StepRange,
    userId: mongoose.Types.ObjectId,
    progressType: 'main' | 'sub',
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<DeckWindow> {
    const windowSteps = this.getWindowSteps(steps, config);
    const allWindows = this.generateAllWindows(level, config);
    const windowIndex = allWindows.findIndex((window) => window.start === steps.start && window.end === steps.end);

    // Fetch words for the window steps
    const words = await Word.find({
      level: level,
      step: { $in: windowSteps },
    }).sort({ step: 1, entry: 1 });

    const wordIds = words.map((word) => word._id);

    // Get bookmarked word IDs for this user
    const WordProgress = mongoose.model('WordProgress');
    const bookmarkedWordIds = await WordProgress.find({
      user_id: userId,
      is_bookmarked: true,
    }).distinct('word_id');

    // Separate bookmarked and non-bookmarked words
    const bookmarkedWords = wordIds.filter((wordId) =>
      bookmarkedWordIds.some((bookmarkedId: mongoose.Types.ObjectId) => bookmarkedId.equals(wordId))
    );
    const nonBookmarkedWords = wordIds.filter(
      (wordId) => !bookmarkedWordIds.some((bookmarkedId: mongoose.Types.ObjectId) => bookmarkedId.equals(wordId))
    );

    // Shuffle both groups
    const shuffledBookmarks = this.shuffleArray(bookmarkedWords);
    const shuffledNonBookmarks = this.shuffleArray(nonBookmarkedWords);

    // Create weighted distribution (40% priority zone for bookmarks)
    const totalWords = wordIds.length;
    const priorityZoneSize = Math.ceil(totalWords * 0.4);
    const bookmarksInZone = Math.min(shuffledBookmarks.length, priorityZoneSize);

    const priorityBookmarks = shuffledBookmarks.slice(0, bookmarksInZone);
    const remainingBookmarks = shuffledBookmarks.slice(bookmarksInZone);

    // Build priority zone with 2:1 ratio (bookmarks:regular)
    const priorityZone: mongoose.Types.ObjectId[] = [];
    let bookmarkIdx = 0;
    let nonBookmarkIdx = 0;

    while (priorityZone.length < priorityZoneSize) {
      // Add 2 bookmarks
      for (let i = 0; i < 2 && bookmarkIdx < priorityBookmarks.length && priorityZone.length < priorityZoneSize; i++) {
        priorityZone.push(priorityBookmarks[bookmarkIdx++]);
      }
      // Add 1 regular word
      if (nonBookmarkIdx < shuffledNonBookmarks.length && priorityZone.length < priorityZoneSize) {
        priorityZone.push(shuffledNonBookmarks[nonBookmarkIdx++]);
      }
      // Safety break if we run out of both
      if (bookmarkIdx >= priorityBookmarks.length && nonBookmarkIdx >= shuffledNonBookmarks.length) {
        break;
      }
    }

    // Combine remaining words
    const remainingZone = [
      ...remainingBookmarks,
      ...shuffledNonBookmarks.slice(nonBookmarkIdx),
    ];

    // Final ordered deck
    const orderedWordIds = [...priorityZone, ...this.shuffleArray(remainingZone)];

    return {
      level,
      steps,
      wordIds: orderedWordIds,
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

  /**
   * Check if user can move to next window
   */
  static canMoveToNextWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): boolean {
    const nextWindow = this.getNextWindow(currentSteps, level, config);
    return nextWindow !== null;
  }

  /**
   * Check if current window is the last window for the level
   */
  static isLastWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): boolean {
    const allWindows = this.generateAllWindows(level, config);
    const currentIndex = allWindows.findIndex(
      (window) => window.start === currentSteps.start && window.end === currentSteps.end
    );

    return currentIndex === allWindows.length - 1;
  }

  /**
   * Get recommended next level based on current progress
   */
  static getRecommendedNextLevel(currentLevel: LearningLevel): LearningLevel | null {
    const levels: LearningLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === -1 || currentIndex >= levels.length - 1) {
      return null; // Already at highest level or invalid level
    }

    return levels[currentIndex + 1];
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

  /**
   * Get window statistics for analytics
   */
  static getWindowStatistics(
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): {
    totalWindows: number;
    standardWindows: number;
    circularWindows: number;
    windowSize: number;
  } {
    const allWindows = this.generateAllWindows(level, config);
    const circularCount = allWindows.filter((window) => this.isCircularWindow(window, config)).length;

    return {
      totalWindows: allWindows.length,
      standardWindows: allWindows.length - circularCount,
      circularWindows: circularCount,
      windowSize: config.windowSize,
    };
  }

  /**
   * Generate window transition map for visualization
   */
  static generateWindowTransitionMap(
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Array<{
    current: StepRange;
    next: StepRange | null;
    isCircular: boolean;
    progress: number;
  }> {
    const allWindows = this.generateAllWindows(level, config);

    return allWindows.map((window, index) => ({
      current: window,
      next: index < allWindows.length - 1 ? allWindows[index + 1] : null,
      isCircular: this.isCircularWindow(window, config),
      progress: Math.round(((index + 1) / allWindows.length) * 100),
    }));
  }
}

export default SlidingWindowService;
