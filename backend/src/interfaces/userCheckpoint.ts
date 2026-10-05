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
  isCompleted(): boolean; // pass traversal complete (current_index >= shuffled_order.length)
  isWindowCompleted(userId: mongoose.Types.ObjectId, progressType: ProgressType): Promise<boolean>; // all words known
  getCurrentWord(): mongoose.Types.ObjectId | null;
  isAtWord(index: number, wordId: mongoose.Types.ObjectId): boolean;
  getRemainingWords(): mongoose.Types.ObjectId[];
  moveToNext(): boolean;
  resetProgress(): void;
  getSessionStats(): SessionStats;
  canMoveToNextWindow(userId: mongoose.Types.ObjectId, progressType: ProgressType): Promise<boolean>;
  reshuffleUnknownWords(userId: mongoose.Types.ObjectId, progressType: ProgressType): Promise<number>;
  generateNextSlidingWindow(userId: mongoose.Types.ObjectId, progressType: ProgressType): Promise<void>;
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
  filterDeckByUserProgress(
    wordIds: mongoose.Types.ObjectId[],
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    options?: DeckGenerationOptions
  ): Promise<mongoose.Types.ObjectId[]>;
}

export default UserCheckpointModel;
