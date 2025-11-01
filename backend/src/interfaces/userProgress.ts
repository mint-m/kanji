import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import {
  LearningLevel,
  ProgressType,
  StepRange,
  DeckGenerationOptions,
  SessionStats,
} from '../types/common';

// Re-export types from common for backwards compatibility
export { LearningLevel, ProgressType, StepRange, DeckGenerationOptions, SessionStats };

// UserProgress document interface
export interface UserProgressDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  progress_type: ProgressType;
  current_level: LearningLevel;
  steps: StepRange;
  shuffled_order: mongoose.Types.ObjectId[];
  current_index: number;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  isCompleted(): boolean;
  getCurrentWord(): mongoose.Types.ObjectId | null;
  getRemainingWords(): mongoose.Types.ObjectId[];
  moveToNext(): boolean;
  moveToPrevious(): boolean;
  resetProgress(): void;
  getSessionStats(): SessionStats;
  canMoveToNextWindow(): Promise<boolean>;
  generateNextSlidingWindow(): Promise<void>;
}

// UserProgress model interface with static methods
export interface UserProgressModel extends Model<UserProgressDocument> {
  findByUserAndType(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<UserProgressDocument | null>;
  getActiveProgressForUser(userId: mongoose.Types.ObjectId): Promise<UserProgressDocument[]>;
  createNewSession(
    userId: mongoose.Types.ObjectId,
    type: ProgressType,
    level: LearningLevel,
    steps: StepRange
  ): Promise<UserProgressDocument>;
  generateSlidingWindowDeck(
    level: LearningLevel,
    steps: StepRange,
    userId: mongoose.Types.ObjectId,
    options?: DeckGenerationOptions
  ): Promise<mongoose.Types.ObjectId[]>;
  filterDeckByUserProgress(
    wordIds: mongoose.Types.ObjectId[],
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    options?: DeckGenerationOptions
  ): Promise<mongoose.Types.ObjectId[]>;
  getNextSlidingWindow(currentSteps: StepRange, level: LearningLevel): Promise<StepRange | null>;
  getUserLearningStats(userId: mongoose.Types.ObjectId): Promise<any>;

  // Checkpoint management methods
  saveCheckpoint(userId: mongoose.Types.ObjectId, progressType: ProgressType): Promise<boolean>;
  restoreFromCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    checkpointId?: string
  ): Promise<UserProgressDocument | null>;

  // Enhanced sliding window methods
  getAvailableWindows(level: LearningLevel): Promise<StepRange[]>;
  getWindowStatistics(level: LearningLevel): any;
  generateWindowTransitionMap(level: LearningLevel): any;

  // Utility methods
  shuffleArray<T>(array: T[]): T[];
}

export default UserProgressModel;
