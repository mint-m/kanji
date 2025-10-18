import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { ProgressType, LearningLevel, StepRange } from './userProgress';
import { DeckWindow } from '../services/slidingWindowService';

// Checkpoint document stored in database
export interface CheckpointDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  progress_type: ProgressType;
  level: LearningLevel;

  // Current window state
  current_window: {
    level: LearningLevel;
    steps: StepRange;
    word_ids: mongoose.Types.ObjectId[];
    window_index: number;
    is_circular: boolean;
    total_windows: number;
  };

  // Progress state
  current_index: number;
  shuffled_order: mongoose.Types.ObjectId[];

  // History tracking
  window_history: StepRange[];
  completed_windows: number;

  // Session statistics
  session_stats: {
    words_completed: number;
    total_words: number;
    session_start_time: Date;
    last_activity_time: Date;
  };

  // Metadata
  version: string;
  is_active: boolean;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Checkpoint model interface with static methods
export interface CheckpointModel extends Model<CheckpointDocument> {
  // Find checkpoints
  findLatestByUser(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType
  ): Promise<CheckpointDocument | null>;

  findActiveCheckpoints(
    userId: mongoose.Types.ObjectId
  ): Promise<CheckpointDocument[]>;

  // Create checkpoint
  createCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    currentWindow: DeckWindow,
    currentIndex: number,
    shuffledOrder: mongoose.Types.ObjectId[],
    windowHistory?: StepRange[],
    completedWindows?: number
  ): Promise<CheckpointDocument>;

  // Cleanup
  cleanupExpiredCheckpoints(): Promise<number>;
  cleanupOldCheckpointsForUser(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    keepCount?: number
  ): Promise<number>;

  // Deactivate
  deactivateCheckpoint(checkpointId: mongoose.Types.ObjectId): Promise<boolean>;
  deactivateAllForUser(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType
  ): Promise<number>;
}

export default CheckpointModel;
