import { LearningLevel, StepRange, ObjectId } from '../common';

export interface WindowConfig {
  windowSize: number;
  maxStep: number;
  minStep: number;
}

export interface DeckWindow {
  level: LearningLevel;
  steps: StepRange;
  wordIds: ObjectId[];
  windowIndex: number;
  isCircular: boolean;
  totalWindows: number;
}

export interface WindowCheckpoint {
  level: LearningLevel;
  currentWindow: DeckWindow;
  completedWindows: number;
  isLevelCompleted: boolean;
  updatedAt: Date;
}
