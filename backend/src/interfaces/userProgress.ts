import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';

// Progress session types
export type ProgressType = 'main' | 'sub';

// Learning levels
export type LearningLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Sliding window step range
export interface StepRange {
  start: number;
  end: number;
}

// Deck generation options
export interface DeckGenerationOptions {
  excludeCompleted?: boolean;
  prioritizeBookmarked?: boolean;
  shuffleOrder?: boolean;
  maxWords?: number;
}

// Learning session statistics
export interface SessionStats {
  totalWords: number;
  completedWords: number;
  remainingWords: number;
  progressPercentage: number;
  averageWordsPerStep: number;
  currentStep: number;
  totalSteps: number;
}

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
  getNextSlidingWindow(currentSteps: StepRange, level: LearningLevel): Promise<StepRange | null>;
  getUserLearningStats(userId: mongoose.Types.ObjectId): Promise<any>;
}

export default UserProgressModel;