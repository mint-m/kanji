import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { LearningLevel, ProgressType, StepRange, DeckGenerationOptions, SessionStats } from '../types/common';

// UserCheckpoint document interface
export interface UserCheckpointDocument extends Document {
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
  updateCheckpoint(): Promise<boolean>;
  canMoveToNextWindow(): Promise<boolean>;
  generateNextSlidingWindow(): Promise<void>;
}

// UserCheckpoint model interface with static methods
export interface UserCheckpointModel extends Model<UserCheckpointDocument> {
  findByUserAndType(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<UserCheckpointDocument | null>;
  getActiveProgressForUser(userId: mongoose.Types.ObjectId): Promise<UserCheckpointDocument[]>;
  createNewSession(
    userId: mongoose.Types.ObjectId,
    type: ProgressType,
    level: LearningLevel,
    steps: StepRange
  ): Promise<UserCheckpointDocument>;
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

  // Enhanced sliding window methods
  getAvailableWindows(level: LearningLevel): Promise<StepRange[]>;

  // Utility methods
  shuffleArray<T>(array: T[]): T[];
}

export default UserCheckpointModel;
