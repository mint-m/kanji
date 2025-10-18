import mongoose from 'mongoose';
import { CheckpointDocument, CheckpointModel } from '../interfaces/checkpoint';
import { ProgressType, LearningLevel, StepRange } from '../interfaces/userProgress';
import { DeckWindow } from '../services/slidingWindowService';

const checkpointSchema = new mongoose.Schema<CheckpointDocument>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    progress_type: {
      type: String,
      required: true,
      enum: ['main', 'sub'],
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
    },
    current_window: {
      level: {
        type: String,
        required: true,
        enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
      },
      steps: {
        start: { type: Number, required: true },
        end: { type: Number, required: true },
      },
      word_ids: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Word',
        },
      ],
      window_index: { type: Number, required: true },
      is_circular: { type: Boolean, required: true },
      total_windows: { type: Number, required: true },
    },
    current_index: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shuffled_order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word',
      },
    ],
    window_history: [
      {
        start: { type: Number, required: true },
        end: { type: Number, required: true },
      },
    ],
    completed_windows: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    session_stats: {
      words_completed: { type: Number, default: 0 },
      total_words: { type: Number, default: 0 },
      session_start_time: { type: Date, default: Date.now },
      last_activity_time: { type: Date, default: Date.now },
    },
    version: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound indexes for efficient queries
checkpointSchema.index({ user_id: 1, progress_type: 1, is_active: 1 });
checkpointSchema.index({ user_id: 1, is_active: 1, created_at: -1 });
checkpointSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Static Methods
checkpointSchema.statics.findLatestByUser = function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<CheckpointDocument | null> {
  return this.findOne({
    user_id: userId,
    progress_type: progressType,
    is_active: true,
  })
    .sort({ created_at: -1 })
    .exec();
};

checkpointSchema.statics.findActiveCheckpoints = function (
  userId: mongoose.Types.ObjectId
): Promise<CheckpointDocument[]> {
  return this.find({
    user_id: userId,
    is_active: true,
  })
    .sort({ created_at: -1 })
    .exec();
};

checkpointSchema.statics.createCheckpoint = async function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  currentWindow: DeckWindow,
  currentIndex: number,
  shuffledOrder: mongoose.Types.ObjectId[],
  windowHistory: StepRange[] = [],
  completedWindows: number = 0
): Promise<CheckpointDocument> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const checkpoint = new this({
    user_id: userId,
    progress_type: progressType,
    level: currentWindow.level,
    current_window: {
      level: currentWindow.level,
      steps: currentWindow.steps,
      word_ids: currentWindow.wordIds,
      window_index: currentWindow.windowIndex,
      is_circular: currentWindow.isCircular,
      total_windows: currentWindow.totalWindows,
    },
    current_index: currentIndex,
    shuffled_order: shuffledOrder,
    window_history: windowHistory,
    completed_windows: completedWindows,
    session_stats: {
      words_completed: currentIndex,
      total_words: shuffledOrder.length,
      session_start_time: now,
      last_activity_time: now,
    },
    version: '1.0.0',
    is_active: true,
    expires_at: expiresAt,
  });

  return await checkpoint.save();
};

checkpointSchema.statics.cleanupExpiredCheckpoints = async function (): Promise<number> {
  const result = await this.deleteMany({
    expires_at: { $lt: new Date() },
  });
  return result.deletedCount || 0;
};

checkpointSchema.statics.cleanupOldCheckpointsForUser = async function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  keepCount: number = 10
): Promise<number> {
  // Get all checkpoints for this user/type sorted by creation date
  const checkpoints: CheckpointDocument[] = await this.find({
    user_id: userId,
    progress_type: progressType,
  })
    .sort({ created_at: -1 })
    .select('_id')
    .exec();

  if (checkpoints.length <= keepCount) {
    return 0; // Nothing to clean up
  }

  // Get IDs of checkpoints to delete (all except the newest `keepCount`)
  const checkpointsToDelete = checkpoints.slice(keepCount).map((cp) => cp._id);

  const result = await this.deleteMany({
    _id: { $in: checkpointsToDelete },
  });

  return result.deletedCount || 0;
};

checkpointSchema.statics.deactivateCheckpoint = async function (
  checkpointId: mongoose.Types.ObjectId
): Promise<boolean> {
  const result = await this.updateOne({ _id: checkpointId }, { $set: { is_active: false, updated_at: new Date() } });
  return (result.modifiedCount || 0) > 0;
};

checkpointSchema.statics.deactivateAllForUser = async function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<number> {
  const result = await this.updateMany(
    {
      user_id: userId,
      progress_type: progressType,
      is_active: true,
    },
    {
      $set: { is_active: false, updated_at: new Date() },
    }
  );
  return result.modifiedCount || 0;
};

// Pre-save middleware
checkpointSchema.pre('save', function (next) {
  // Update last activity time
  this.session_stats.last_activity_time = new Date();
  next();
});

// Create and export model
const Checkpoint = mongoose.model<CheckpointDocument, CheckpointModel>(
  'Checkpoint',
  checkpointSchema,
  'learning_checkpoints'
);

export default Checkpoint;
