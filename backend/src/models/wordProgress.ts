import mongoose from 'mongoose';
import {
  WordProgressDocument,
  WordProgressModel,
  StudyResult,
  WordStudyStats,
  BookmarkInfo,
} from '../interfaces/wordProgress';
import { ProgressType } from '../types/common';

export interface WordWithProgress {
  _id: mongoose.Types.ObjectId;
  entry: string;
  pron?: string;
  level: string;
  step: number;
  means: string[];
  parts: string[];
  bookmarkInfo?: {
    isBookmarked: boolean;
    reason?: string;
    tags: string[];
    bookmarkedAt?: Date;
  };
  progressInfo?: {
    isWindowCompleted: boolean;
    tryCount: number;
    correctCount: number;
    successRate: number;
    lastStudiedAt?: Date;
    timeSpentTotal: number;
  };
}

export interface AggregatedWordProgress {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  word_id: mongoose.Types.ObjectId;
  progress_type: string;
  is_window_completed: boolean;
  try_count: number;
  correct_count: number;
  is_bookmarked: boolean;
  bookmark_reason?: string;
  bookmark_tags: string[];
  time_spent_total: number;
  last_studied_at?: Date;
  word: WordWithProgress;
}

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

wordProgressSchema.statics.findByUserWordAndType = function (
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  progressType: string = 'main'
): Promise<WordProgressDocument | null> {
  return this.findOne({ user_id: userId, word_id: wordId, progress_type: progressType });
};

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

wordProgressSchema.statics.getStudyStats = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<any> {
  return this.aggregate([
    { $match: { user_id: userId, progress_type: type } },
    {
      $group: {
        _id: null,
        total_words: { $sum: 1 },
        completed_words: { $sum: { $cond: ['$is_window_completed', 1, 0] } },
        bookmarked_words: { $sum: { $cond: ['$is_bookmarked', 1, 0] } },
        total_tries: { $sum: '$try_count' },
        total_correct: { $sum: '$correct_count' },
        avg_tries: { $avg: '$try_count' },
        avg_success_rate: {
          $avg: {
            $cond: [{ $gt: ['$try_count', 0] }, { $divide: ['$correct_count', '$try_count'] }, 0],
          },
        },
        total_time_spent: { $sum: '$time_spent_total' },
      },
    },
  ]);
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

wordProgressSchema.statics.getUnknownWordsFromDeck = async function (
  userId: mongoose.Types.ObjectId,
  wordIds: mongoose.Types.ObjectId[],
  progressType: ProgressType
): Promise<mongoose.Types.ObjectId[]> {
  const knownIds = await this.find({
    user_id: userId,
    word_id: { $in: wordIds },
    progress_type: progressType,
    is_window_completed: true,
  }).distinct('word_id');

  return wordIds.filter((id) => !knownIds.some((knownId: mongoose.Types.ObjectId) => id.equals(knownId)));
};

wordProgressSchema.statics.getBookmarkAnalytics = async function (
  userId: mongoose.Types.ObjectId
): Promise<any> {
  const pipeline = [
    { $match: { user_id: userId, is_bookmarked: true } },
    { $lookup: { from: 'word', localField: 'word_id', foreignField: '_id', as: 'word' } },
    { $unwind: '$word' },
    {
      $group: {
        _id: null,
        totalBookmarks: { $sum: 1 },
        completedBookmarks: { $sum: { $cond: ['$is_window_completed', 1, 0] } },
        incompleteBookmarks: { $sum: { $cond: [{ $not: '$is_window_completed' }, 1, 0] } },
        avgSuccessRate: {
          $avg: {
            $cond: [{ $gt: ['$try_count', 0] }, { $divide: ['$correct_count', '$try_count'] }, 0],
          },
        },
        totalTimeSpent: { $sum: '$time_spent_total' },
        avgTimePerBookmark: { $avg: '$time_spent_total' },
        levelDistribution: { $push: { level: '$word.level', step: '$word.step' } },
        tagDistribution: { $push: '$bookmark_tags' },
        reasonsUsed: {
          $push: {
            $cond: [
              { $and: [{ $ne: ['$bookmark_reason', null] }, { $ne: ['$bookmark_reason', ''] }] },
              '$bookmark_reason',
              '$$REMOVE',
            ],
          },
        },
        recentActivity: {
          $push: { date: '$last_studied_at', wordId: '$word_id', completed: '$is_window_completed' },
        },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [{ $gt: ['$totalBookmarks', 0] }, { $divide: ['$completedBookmarks', '$totalBookmarks'] }, 0],
        },
        avgSuccessRatePercentage: { $multiply: ['$avgSuccessRate', 100] },
        levelBreakdown: {
          $reduce: {
            input: '$levelDistribution',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[{
                    k: '$$this.level',
                    v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.level', input: '$$value' } }, 0] }, 1] },
                  }]],
                },
              ],
            },
          },
        },
        uniqueTags: { $reduce: { input: '$tagDistribution', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
        recentBookmarkActivity: {
          $slice: [{
            $sortArray: {
              input: { $filter: { input: '$recentActivity', cond: { $ne: ['$$this.date', null] } } },
              sortBy: { date: -1 },
            },
          }, 10],
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalBookmarks: 1,
        completedBookmarks: 1,
        incompleteBookmarks: 1,
        completionRate: 1,
        avgSuccessRatePercentage: 1,
        totalTimeSpent: 1,
        avgTimePerBookmark: 1,
        levelBreakdown: 1,
        uniqueTags: 1,
        recentBookmarkActivity: 1,
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalBookmarks: 0,
    completedBookmarks: 0,
    incompleteBookmarks: 0,
    completionRate: 0,
    avgSuccessRatePercentage: 0,
    totalTimeSpent: 0,
    avgTimePerBookmark: 0,
    levelBreakdown: {},
    uniqueTags: [],
    recentBookmarkActivity: [],
  };
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
