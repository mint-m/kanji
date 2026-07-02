import mongoose from 'mongoose';
import {
  WordProgressDocument,
  WordProgressModel,
  StudyResult,
  WordStudyStats,
  BookmarkInfo,
} from '../interfaces/wordProgress';
import { ProgressType } from '../types/common';

const wordProgressSchema = new mongoose.Schema<WordProgressDocument>(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    word_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Word' },
    progress_type: { type: String, required: true, enum: ['main', 'sub'] },
    is_window_completed: { type: Boolean, required: true, default: false },
    try_count: { type: Number, required: true, default: 0, min: 0 },
    correct_count: { type: Number, required: true, default: 0, min: 0 },
    is_bookmarked: { type: Boolean, required: true, default: false },
    last_studied_at: { type: Date },
    first_studied_at: { type: Date },
    study_streak: { type: Number, default: 0, min: 0 },
    time_spent_total: { type: Number, default: 0, min: 0 },
    bookmark_reason: { type: String },
    bookmark_tags: [{ type: String }],
    bookmarked_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

wordProgressSchema.index({ user_id: 1, progress_type: 1 });
wordProgressSchema.index({ user_id: 1, word_id: 1, progress_type: 1 }, { unique: true });
wordProgressSchema.index({ user_id: 1, is_bookmarked: 1 });
wordProgressSchema.index({ user_id: 1, is_window_completed: 1, progress_type: 1 });
wordProgressSchema.index({ word_id: 1 });
wordProgressSchema.index({ last_studied_at: 1 });

// ── Instance methods ──────────────────────────────────────────────────────────

wordProgressSchema.methods.markCompleted = function (this: WordProgressDocument): void {
  this.is_window_completed = true;
};

wordProgressSchema.methods.markIncomplete = function (this: WordProgressDocument): void {
  this.is_window_completed = false;
};

wordProgressSchema.methods.recordStudyAttempt = function (this: WordProgressDocument, result: StudyResult): void {
  this.try_count++;
  this.last_studied_at = result.studiedAt;

  if (!this.first_studied_at) {
    this.first_studied_at = result.studiedAt;
  }

  if (result.isCorrect) {
    this.correct_count++;
    this.study_streak++;
  } else {
    this.study_streak = 0;
  }

  if (result.timeSpent) {
    this.time_spent_total += result.timeSpent;
  }
};

wordProgressSchema.methods.toggleBookmark = function (
  this: WordProgressDocument,
  reason?: string,
  tags?: string[]
): boolean {
  this.is_bookmarked = !this.is_bookmarked;

  if (this.is_bookmarked) {
    this.bookmark_reason = reason;
    this.bookmark_tags = tags || [];
    this.bookmarked_at = new Date();
  } else {
    this.bookmark_reason = undefined;
    this.bookmark_tags = [];
    this.bookmarked_at = undefined;
  }

  return this.is_bookmarked;
};

wordProgressSchema.methods.getStudyStats = function (this: WordProgressDocument): WordStudyStats {
  const totalAttempts = this.try_count;
  const correctAttempts = this.correct_count;
  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const averageTimeSpent = totalAttempts > 0 ? this.time_spent_total / totalAttempts : 0;

  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts: totalAttempts - correctAttempts,
    successRate,
    averageTimeSpent,
    lastStudied: this.last_studied_at,
    firstStudied: this.first_studied_at,
    studyStreak: this.study_streak,
  };
};

wordProgressSchema.methods.getBookmarkInfo = function (this: WordProgressDocument): BookmarkInfo {
  return {
    isBookmarked: this.is_bookmarked,
    bookmarkedAt: this.bookmarked_at,
    reason: this.bookmark_reason,
    tags: this.bookmark_tags,
  };
};

wordProgressSchema.methods.calculateMasteryLevel = function (
  this: WordProgressDocument
): 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
  const { successRate, totalAttempts } = this.getStudyStats();

  if (successRate >= 90 && totalAttempts >= 5 && this.study_streak >= 3) return 'mastered';
  if (successRate >= 75 && totalAttempts >= 3) return 'advanced';
  if (successRate >= 50 && totalAttempts >= 2) return 'intermediate';
  return 'beginner';
};

wordProgressSchema.methods.getRecommendedAction = function (
  this: WordProgressDocument
): 'continue' | 'review' | 'skip' {
  const { successRate } = this.getStudyStats();
  const daysSince = this.getDaysSinceLastStudy();

  if (successRate >= 90 && this.study_streak >= 3) return 'skip';
  if (daysSince >= 7 || successRate < 70) return 'review';
  return 'continue';
};

wordProgressSchema.methods.getDaysSinceLastStudy = function (this: WordProgressDocument): number {
  if (!this.last_studied_at) return Infinity;
  const diffMs = Math.abs(Date.now() - this.last_studied_at.getTime());
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

// ── Static methods ────────────────────────────────────────────────────────────

wordProgressSchema.statics.findOrCreate = async function (
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<WordProgressDocument> {
  let progress = await this.findOne({ user_id: userId, word_id: wordId, progress_type: progressType });

  if (!progress) {
    progress = new this({ user_id: userId, word_id: wordId, progress_type: progressType });
    await progress.save();
  }

  return progress;
};

wordProgressSchema.statics.resetWindowCompletionForWords = async function (
  userId: mongoose.Types.ObjectId,
  wordIds: mongoose.Types.ObjectId[],
  progressType: ProgressType
): Promise<number> {
  const result = await this.updateMany(
    { user_id: userId, word_id: { $in: wordIds }, progress_type: progressType },
    { $set: { is_window_completed: false } }
  );
  return result.modifiedCount;
};

// ── Pre-save hook ─────────────────────────────────────────────────────────────

wordProgressSchema.pre('save', function (this: WordProgressDocument, next: (err?: Error) => void) {
  if (this.isModified('is_window_completed') || this.isModified('try_count')) {
    this.last_studied_at = new Date();
  }
  if (this.correct_count > this.try_count) {
    this.correct_count = this.try_count;
  }
  next();
});

const WordProgress = mongoose.model<WordProgressDocument, WordProgressModel>(
  'WordProgress',
  wordProgressSchema,
  'word_progress'
);

export default WordProgress;
