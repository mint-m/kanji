import mongoose from 'mongoose';
import {
  WordProgressDocument,
  WordProgressModel,
  StudyResult,
  WordStudyStats,
  BookmarkInfo,
  LearningAnalytics,
  BulkWordOperation,
} from '../interfaces/wordProgress';
import { ProgressType, LearningLevel } from '../types/common';

// Type for aggregated word data with progress info
export interface WordWithProgress {
  _id: mongoose.Types.ObjectId;
  origin_entry_id: string;
  entry: string; // Hiragana reading
  pron?: string; // Kanji form (optional)
  level: LearningLevel;
  step: number;
  means: string[]; // Korean meanings array
  parts: string[]; // Parts of speech array
  createdAt: Date;
  updatedAt: Date;

  // Progress information added by aggregation
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

// Type for aggregation pipeline results
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

// WordProgress - Individual word completion tracking
// Tracks each user's progress on individual words including completion and bookmarks
const wordProgressSchema = new mongoose.Schema<WordProgressDocument>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    word_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Word',
    },
    progress_type: {
      type: String,
      required: true,
      enum: ['main', 'sub'],
    },
    is_window_completed: {
      type: Boolean,
      required: true,
      default: false,
    },
    try_count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    correct_count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    is_bookmarked: {
      type: Boolean,
      required: true,
      default: false,
    },
    last_studied_at: {
      type: Date,
    },
    first_studied_at: {
      type: Date,
    },
    study_streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    time_spent_total: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmark_reason: {
      type: String,
    },
    bookmark_tags: [
      {
        type: String,
      },
    ],
    bookmarked_at: {
      type: Date,
    },
    study_history: [
      {
        isCorrect: { type: Boolean, required: true },
        timeSpent: { type: Number, min: 0 },
        studiedAt: { type: Date, required: true, default: Date.now },
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false, // Only track creation time, use last_studied_at for updates
    },
  }
);

// Compound indexes for efficient queries
wordProgressSchema.index({ user_id: 1, progress_type: 1 });
wordProgressSchema.index({ user_id: 1, word_id: 1, progress_type: 1 }, { unique: true });
wordProgressSchema.index({ user_id: 1, is_bookmarked: 1 });
wordProgressSchema.index({ user_id: 1, is_window_completed: 1, progress_type: 1 });
wordProgressSchema.index({ word_id: 1 });
wordProgressSchema.index({ last_studied_at: 1 });

// Instance methods
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

  this.study_history.push(result);

  // Limit history to last 50 attempts for performance
  if (this.study_history.length > 50) {
    this.study_history = this.study_history.slice(-50);
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

wordProgressSchema.methods.updateStudyTime = function (this: WordProgressDocument, timeSpent: number): void {
  this.time_spent_total += timeSpent;
  this.last_studied_at = new Date();
};

wordProgressSchema.methods.resetProgress = function (this: WordProgressDocument): void {
  this.is_window_completed = false;
  this.try_count = 0;
  this.correct_count = 0;
  this.study_streak = 0;
  this.time_spent_total = 0;
  this.study_history = [];
  this.last_studied_at = undefined;
  this.first_studied_at = undefined;
};

wordProgressSchema.methods.getStudyStats = function (this: WordProgressDocument): WordStudyStats {
  const totalAttempts = this.try_count;
  const correctAttempts = this.correct_count;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const averageTimeSpent =
    this.study_history.length > 0
      ? this.study_history.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / this.study_history.length
      : 0;

  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
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

wordProgressSchema.methods.getLearningAnalytics = function (this: WordProgressDocument): LearningAnalytics {
  const stats = this.getStudyStats();
  const masteryLevel = this.calculateMasteryLevel();

  const recentAttempts = this.study_history.slice(-10);
  const retentionRate =
    recentAttempts.length > 0
      ? (recentAttempts.filter((a) => a.isCorrect).length / recentAttempts.length) * 100
      : stats.successRate;

  const optimalReviewInterval = Math.max(1, Math.min(30, Math.floor(stats.successRate / 10) + this.study_streak));

  return {
    retentionRate,
    optimalReviewInterval,
    masteryLevel,
    recommendedAction: this.getRecommendedAction(),
  };
};

wordProgressSchema.methods.calculateMasteryLevel = function (
  this: WordProgressDocument
): 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
  const stats = this.getStudyStats();

  if (stats.successRate >= 90 && stats.totalAttempts >= 5 && this.study_streak >= 3) {
    return 'mastered';
  } else if (stats.successRate >= 75 && stats.totalAttempts >= 3) {
    return 'advanced';
  } else if (stats.successRate >= 50 && stats.totalAttempts >= 2) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
};

wordProgressSchema.methods.getRecommendedAction = function (
  this: WordProgressDocument
): 'continue' | 'review' | 'skip' {
  const stats = this.getStudyStats();
  const daysSinceLastStudy = this.getDaysSinceLastStudy();

  if (stats.successRate >= 90 && this.study_streak >= 3) {
    return 'skip';
  } else if (daysSinceLastStudy >= 7 || stats.successRate < 70) {
    return 'review';
  } else {
    return 'continue';
  }
};

wordProgressSchema.methods.isEligibleForReview = function (this: WordProgressDocument): boolean {
  const daysSinceLastStudy = this.getDaysSinceLastStudy();
  const analytics = this.getLearningAnalytics();

  return daysSinceLastStudy >= analytics.optimalReviewInterval;
};

wordProgressSchema.methods.getDaysSinceLastStudy = function (this: WordProgressDocument): number {
  if (!this.last_studied_at) return Infinity;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.last_studied_at.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Static methods
wordProgressSchema.statics.findByUserWordAndType = function (
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  progressType: string = 'main'
): Promise<WordProgressDocument | null> {
  return this.findOne({
    user_id: userId,
    word_id: wordId,
    progress_type: progressType,
  });
};

wordProgressSchema.statics.findOrCreate = async function (
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<WordProgressDocument> {
  let progress = await this.findOne({
    user_id: userId,
    word_id: wordId,
    progress_type: progressType,
  });

  if (!progress) {
    progress = new this({
      user_id: userId,
      word_id: wordId,
      progress_type: progressType,
    });
    await progress.save();
  }

  return progress;
};

wordProgressSchema.statics.getCompletedWords = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    is_window_completed: true,
  }).populate('word_id');
};

wordProgressSchema.statics.getIncompleteWords = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    is_window_completed: false,
  }).populate('word_id');
};

wordProgressSchema.statics.getBookmarkedWords = function (
  userId: mongoose.Types.ObjectId,
  tags?: string[]
): Promise<WordProgressDocument[]> {
  const filter: any = {
    user_id: userId,
    is_bookmarked: true,
  };

  if (tags && tags.length > 0) {
    filter.bookmark_tags = { $in: tags };
  }

  return this.find(filter).populate('word_id');
};

wordProgressSchema.statics.getWordsNeedingReview = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  daysSince: number = 7
): Promise<WordProgressDocument[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSince);

  return this.find({
    user_id: userId,
    progress_type: type,
    $or: [{ last_studied_at: { $lt: cutoffDate } }, { last_studied_at: { $exists: false } }],
  }).populate('word_id');
};

wordProgressSchema.statics.getUserWordProgress = function (
  userId: mongoose.Types.ObjectId,
  type?: ProgressType
): Promise<WordProgressDocument[]> {
  const filter: any = { user_id: userId };
  if (type) filter.progress_type = type;

  return this.find(filter).populate('word_id');
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

wordProgressSchema.statics.getLevelProgress = function (
  userId: mongoose.Types.ObjectId,
  level: LearningLevel,
  type: ProgressType
): Promise<any> {
  return this.aggregate([
    {
      $lookup: {
        from: 'word',
        localField: 'word_id',
        foreignField: '_id',
        as: 'word',
      },
    },
    { $unwind: '$word' },
    {
      $match: {
        user_id: userId,
        progress_type: type,
        'word.level': level,
      },
    },
    {
      $group: {
        _id: '$word.step',
        total_words: { $sum: 1 },
        completed_words: { $sum: { $cond: ['$is_window_completed', 1, 0] } },
        total_time_spent: { $sum: '$time_spent_total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

wordProgressSchema.statics.getStudyStreak = async function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<number> {
  const recentProgress = await this.find({
    user_id: userId,
    progress_type: type,
    last_studied_at: { $exists: true },
  })
    .sort({ last_studied_at: -1 })
    .limit(30);

  if (recentProgress.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const progress of recentProgress) {
    const studyDate = new Date(progress.last_studied_at!);
    studyDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - studyDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
};

wordProgressSchema.statics.bulkUpdateProgress = async function (
  operation: BulkWordOperation
): Promise<{ modified: number; errors: any[] }> {
  const { wordIds, action, userId, progressType } = operation;
  const errors: any[] = [];
  let modified = 0;

  try {
    switch (action) {
      case 'mark_completed':
        const completedResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType,
          },
          {
            $set: {
              is_window_completed: true,
              last_studied_at: new Date(),
            },
            $inc: { try_count: 1, correct_count: 1 },
          }
        );
        modified = completedResult.modifiedCount;
        break;

      case 'mark_incomplete':
        const incompleteResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType,
          },
          {
            $set: {
              is_window_completed: false,
              last_studied_at: new Date(),
              study_streak: 0,
            },
            $inc: { try_count: 1 },
          }
        );
        modified = incompleteResult.modifiedCount;
        break;

      case 'bookmark':
        const bookmarkResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
          },
          {
            $set: { is_bookmarked: true },
          }
        );
        modified = bookmarkResult.modifiedCount;
        break;

      case 'unbookmark':
        const unbookmarkResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
          },
          {
            $set: {
              is_bookmarked: false,
              bookmark_reason: undefined,
              bookmark_tags: [],
            },
          }
        );
        modified = unbookmarkResult.modifiedCount;
        break;

      case 'reset_progress':
        const resetResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType,
          },
          {
            $set: {
              is_window_completed: false,
              try_count: 0,
              correct_count: 0,
              study_streak: 0,
              time_spent_total: 0,
              study_history: [],
              last_studied_at: undefined,
              first_studied_at: undefined,
            },
          }
        );
        modified = resetResult.modifiedCount;
        break;

      default:
        throw new Error(`Unknown bulk operation: ${action}`);
    }
  } catch (error) {
    errors.push(error);
  }

  return { modified, errors };
};


wordProgressSchema.statics.getWeakestWords = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  limit: number = 10
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    try_count: { $gt: 0 },
  })
    .sort({
      correct_count: 1,
      try_count: -1,
    })
    .limit(limit)
    .populate('word_id');
};

wordProgressSchema.statics.getStrongestWords = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  limit: number = 10
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    try_count: { $gt: 0 },
  })
    .sort({
      study_streak: -1,
      correct_count: -1,
    })
    .limit(limit)
    .populate('word_id');
};

wordProgressSchema.statics.analyzeStudyPatterns = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  days: number = 30
): Promise<any> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user_id: userId,
        progress_type: type,
        last_studied_at: { $gte: cutoffDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$last_studied_at',
          },
        },
        daily_words_studied: { $sum: 1 },
        daily_words_completed: { $sum: { $cond: ['$is_window_completed', 1, 0] } },
        daily_time_spent: { $sum: '$time_spent_total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Bookmark analytics and statistics
wordProgressSchema.statics.getBookmarkAnalytics = async function (
  userId: mongoose.Types.ObjectId
): Promise<any> {
  // progressType 필터 제거, 전체 북마크 통계 조회
  const pipeline = [
    {
      $match: {
        user_id: userId,
        is_bookmarked: true,
      },
    },
    {
      $lookup: {
        from: 'word',
        localField: 'word_id',
        foreignField: '_id',
        as: 'word',
      },
    },
    { $unwind: '$word' },
    {
      $group: {
        _id: null,
        totalBookmarks: { $sum: 1 },
        completedBookmarks: {
          $sum: { $cond: ['$is_window_completed', 1, 0] },
        },
        incompleteBookmarks: {
          $sum: { $cond: [{ $not: '$is_window_completed' }, 1, 0] },
        },
        avgSuccessRate: {
          $avg: {
            $cond: [{ $gt: ['$try_count', 0] }, { $divide: ['$correct_count', '$try_count'] }, 0],
          },
        },
        totalTimeSpent: { $sum: '$time_spent_total' },
        avgTimePerBookmark: { $avg: '$time_spent_total' },
        levelDistribution: {
          $push: {
            level: '$word.level',
            step: '$word.step',
          },
        },
        tagDistribution: {
          $push: '$bookmark_tags',
        },
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
          $push: {
            date: '$last_studied_at',
            wordId: '$word_id',
            completed: '$is_window_completed',
          },
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
                  $arrayToObject: [
                    [
                      {
                        k: '$$this.level',
                        v: {
                          $add: [{ $ifNull: [{ $getField: { field: '$$this.level', input: '$$value' } }, 0] }, 1],
                        },
                      },
                    ],
                  ],
                },
              ],
            },
          },
        },
        uniqueTags: {
          $reduce: {
            input: '$tagDistribution',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] },
          },
        },
        topReasons: {
          $reduce: {
            input: '$reasonsUsed',
            initialValue: {},
            in: {
              $cond: [
                { $ne: ['$$this', null] },
                {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [
                          {
                            k: '$$this',
                            v: {
                              $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1],
                            },
                          },
                        ],
                      ],
                    },
                  ],
                },
                '$$value',
              ],
            },
          },
        },
        recentBookmarkActivity: {
          $slice: [
            {
              $sortArray: {
                input: {
                  $filter: {
                    input: '$recentActivity',
                    cond: { $ne: ['$$this.date', null] },
                  },
                },
                sortBy: { date: -1 },
              },
            },
            10,
          ],
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
        topReasons: 1,
        recentBookmarkActivity: 1,
        insights: {
          mostProductiveLevel: {
            $arrayElemAt: [
              {
                $map: {
                  input: { $objectToArray: '$levelBreakdown' },
                  as: 'level',
                  in: {
                    level: '$$level.k',
                    count: '$$level.v',
                  },
                },
              },
              0,
            ],
          },
          needsReview: '$incompleteBookmarks',
          studyEfficiency: {
            $cond: [
              { $gt: ['$avgTimePerBookmark', 0] },
              { $divide: ['$completedBookmarks', { $divide: ['$totalTimeSpent', 60000] }] }, // bookmarks per minute
              0,
            ],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      totalBookmarks: 0,
      completedBookmarks: 0,
      incompleteBookmarks: 0,
      completionRate: 0,
      avgSuccessRatePercentage: 0,
      totalTimeSpent: 0,
      avgTimePerBookmark: 0,
      levelBreakdown: {},
      uniqueTags: [],
      topReasons: {},
      recentBookmarkActivity: [],
      insights: {
        mostProductiveLevel: null,
        needsReview: 0,
        studyEfficiency: 0,
      },
    }
  );
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

// Pre-save middleware to update timestamps and maintain data integrity
wordProgressSchema.pre('save', function (this: WordProgressDocument, next: (err?: Error) => void) {
  if (this.isModified('is_window_completed') || this.isModified('try_count')) {
    this.last_studied_at = new Date();
  }

  // Ensure correct_count doesn't exceed try_count
  if (this.correct_count > this.try_count) {
    this.correct_count = this.try_count;
  }

  next();
});

// Create and export model
const WordProgress = mongoose.model<WordProgressDocument, WordProgressModel>(
  'WordProgress',
  wordProgressSchema,
  'word_progress'
);

export default WordProgress;
