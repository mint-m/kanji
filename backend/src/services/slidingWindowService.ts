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

  static generateAllWindows(_level: LearningLevel, config: WindowConfig = this.DEFAULT_CONFIG): StepRange[] {
    const windows: StepRange[] = [];
    const { windowSize, maxStep, minStep } = config;

    for (let start = minStep; start <= maxStep - windowSize + 1; start++) {
      windows.push({ start, end: start + windowSize - 1 });
    }

    // 레벨 끝 순환 윈도우: e.g. 9-1 (steps 9,10,1), 10-2 (steps 10,1,2)
    if (maxStep >= windowSize) {
      for (let offset = 1; offset < windowSize; offset++) {
        const circularStart = maxStep - windowSize + 1 + offset;
        if (circularStart <= maxStep) {
          windows.push({ start: circularStart, end: offset });
        }
      }
    }

    return windows;
  }

  static async getNextWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config?: Partial<WindowConfig>
  ): Promise<StepRange | null> {
    const maxStepResult = await Word.aggregate([
      { $match: { level: level } },
      { $group: { _id: null, maxStep: { $max: '$step' } } },
    ]);
    const maxStep = maxStepResult.length > 0 ? maxStepResult[0].maxStep : 10;

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config, maxStep };
    const allWindows = this.generateAllWindows(level, finalConfig);

    const currentIndex = allWindows.findIndex(
      (window) => window.start === currentSteps.start && window.end === currentSteps.end
    );

    if (currentIndex === -1 || currentIndex >= allWindows.length - 1) {
      return null;
    }

    return allWindows[currentIndex + 1];
  }

  static isCircularWindow(steps: StepRange, _config: WindowConfig = this.DEFAULT_CONFIG): boolean {
    return steps.start > steps.end;
  }

  static getWindowSteps(steps: StepRange, config: WindowConfig = this.DEFAULT_CONFIG): number[] {
    const { maxStep, minStep } = config;

    if (this.isCircularWindow(steps)) {
      const result: number[] = [];
      for (let step = steps.start; step <= maxStep; step++) result.push(step);
      for (let step = minStep; step <= steps.end; step++) result.push(step);
      return result;
    }

    const result: number[] = [];
    for (let step = steps.start; step <= steps.end; step++) result.push(step);
    return result;
  }

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
    }).sort({ step: 1, entry: 1 });

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

  static async getAvailableWindows(
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<StepRange[]> {
    const allWindows = this.generateAllWindows(level, config);
    const validFlags = await Promise.all(
      allWindows.map((window) => this.validateStepRange(level, window, config))
    );
    return allWindows.filter((_, i) => validFlags[i]);
  }

  static async canMoveToNextWindow(
    currentSteps: StepRange,
    level: LearningLevel,
    config: WindowConfig = this.DEFAULT_CONFIG
  ): Promise<boolean> {
    const nextWindow = await this.getNextWindow(currentSteps, level, config);
    return nextWindow !== null;
  }

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
