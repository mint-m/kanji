import mongoose from "mongoose";
import { 
  WordProgressDocument, 
  WordProgressModel, 
  StudyResult, 
  WordStudyStats, 
  BookmarkInfo, 
  LearningAnalytics,
  BulkWordOperation,
  StudySessionSummary
} from '../interfaces/wordProgress';
import { ProgressType, LearningLevel } from '../interfaces/userProgress';

// WordProgress - Individual word completion tracking
// Tracks each user's progress on individual words including completion and bookmarks
const wordProgressSchema = new mongoose.Schema<WordProgressDocument>(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "User" 
    },
    word_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: "Word" 
    },
    progress_type: { 
      type: String, 
      required: true, 
      enum: ["main", "sub"] 
    },
    is_completed: { 
      type: Boolean, 
      required: true, 
      default: false 
    },
    try_count: { 
      type: Number, 
      required: true, 
      default: 0,
      min: 0 
    },
    correct_count: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    is_bookmarked: { 
      type: Boolean, 
      required: true, 
      default: false 
    },
    last_studied_at: { 
      type: Date 
    },
    first_studied_at: {
      type: Date
    },
    study_streak: {
      type: Number,
      default: 0,
      min: 0
    },
    difficulty_rating: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    time_spent_total: {
      type: Number,
      default: 0,
      min: 0
    },
    bookmark_reason: {
      type: String
    },
    bookmark_tags: [{
      type: String
    }],
    study_history: [{
      isCorrect: { type: Boolean, required: true },
      timeSpent: { type: Number, min: 0 },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      studiedAt: { type: Date, required: true, default: Date.now }
    }]
  },
  {
    timestamps: { 
      createdAt: "created_at", 
      updatedAt: false // Only track creation time, use last_studied_at for updates
    }
  }
);

// Compound indexes for efficient queries
wordProgressSchema.index({ user_id: 1, progress_type: 1 });
wordProgressSchema.index({ user_id: 1, word_id: 1, progress_type: 1 }, { unique: true });
wordProgressSchema.index({ user_id: 1, is_bookmarked: 1 });
wordProgressSchema.index({ user_id: 1, is_completed: 1, progress_type: 1 });
wordProgressSchema.index({ word_id: 1 });
wordProgressSchema.index({ last_studied_at: 1 });

// Instance methods
wordProgressSchema.methods.markCompleted = function(this: WordProgressDocument, timeSpent?: number): void {
  this.is_completed = true;
  this.correct_count++;
  this.try_count++;
  this.study_streak++;
  this.last_studied_at = new Date();
  
  if (!this.first_studied_at) {
    this.first_studied_at = new Date();
  }
  
  if (timeSpent) {
    this.time_spent_total += timeSpent;
  }
  
  // Record study attempt
  this.study_history.push({
    isCorrect: true,
    timeSpent: timeSpent || 0,
    difficulty: this.difficulty_rating >= 4 ? 'hard' : this.difficulty_rating >= 2 ? 'medium' : 'easy',
    studiedAt: new Date()
  });
  
  // Adjust difficulty rating based on performance
  if (this.difficulty_rating > 1) {
    this.difficulty_rating = Math.max(1, this.difficulty_rating - 0.1);
  }
};

wordProgressSchema.methods.markIncomplete = function(this: WordProgressDocument, timeSpent?: number): void {
  this.is_completed = false;
  this.try_count++;
  this.study_streak = 0; // Reset streak on incorrect answer
  this.last_studied_at = new Date();
  
  if (!this.first_studied_at) {
    this.first_studied_at = new Date();
  }
  
  if (timeSpent) {
    this.time_spent_total += timeSpent;
  }
  
  // Record study attempt
  this.study_history.push({
    isCorrect: false,
    timeSpent: timeSpent || 0,
    difficulty: this.difficulty_rating >= 4 ? 'hard' : this.difficulty_rating >= 2 ? 'medium' : 'easy',
    studiedAt: new Date()
  });
  
  // Increase difficulty rating on incorrect answer
  if (this.difficulty_rating < 5) {
    this.difficulty_rating = Math.min(5, this.difficulty_rating + 0.2);
  }
};

wordProgressSchema.methods.recordStudyAttempt = function(this: WordProgressDocument, result: StudyResult): void {
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

wordProgressSchema.methods.toggleBookmark = function(this: WordProgressDocument, reason?: string, tags?: string[]): boolean {
  this.is_bookmarked = !this.is_bookmarked;
  
  if (this.is_bookmarked) {
    this.bookmark_reason = reason;
    this.bookmark_tags = tags || [];
  } else {
    this.bookmark_reason = undefined;
    this.bookmark_tags = [];
  }
  
  return this.is_bookmarked;
};

wordProgressSchema.methods.updateStudyTime = function(this: WordProgressDocument, timeSpent: number): void {
  this.time_spent_total += timeSpent;
  this.last_studied_at = new Date();
};

wordProgressSchema.methods.resetProgress = function(this: WordProgressDocument): void {
  this.is_completed = false;
  this.try_count = 0;
  this.correct_count = 0;
  this.study_streak = 0;
  this.difficulty_rating = 3;
  this.time_spent_total = 0;
  this.study_history = [];
  this.last_studied_at = undefined;
  this.first_studied_at = undefined;
};

wordProgressSchema.methods.getStudyStats = function(this: WordProgressDocument): WordStudyStats {
  const totalAttempts = this.try_count;
  const correctAttempts = this.correct_count;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const averageTimeSpent = this.study_history.length > 0 
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
    difficultyRating: this.difficulty_rating
  };
};

wordProgressSchema.methods.getBookmarkInfo = function(this: WordProgressDocument): BookmarkInfo {
  return {
    isBookmarked: this.is_bookmarked,
    bookmarkedAt: this.is_bookmarked ? this.last_studied_at : undefined,
    reason: this.bookmark_reason,
    tags: this.bookmark_tags
  };
};

wordProgressSchema.methods.getLearningAnalytics = function(this: WordProgressDocument): LearningAnalytics {
  const stats = this.getStudyStats();
  const masteryLevel = this.calculateMasteryLevel();
  
  // Calculate retention rate based on recent performance
  const recentAttempts = this.study_history.slice(-10);
  const retentionRate = recentAttempts.length > 0 
    ? (recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length) * 100
    : stats.successRate;
  
  // Simple forgetting curve simulation
  const forgettingCurve = this.study_history.slice(-5).map((_, index) => 
    Math.max(0, retentionRate - (index * 10))
  );
  
  // Calculate optimal review interval based on performance
  const optimalReviewInterval = Math.max(1, Math.min(30, 
    Math.floor(stats.successRate / 10) + this.study_streak
  ));

  return {
    retentionRate,
    forgettingCurve,
    optimalReviewInterval,
    masteryLevel,
    recommendedAction: this.getRecommendedAction()
  };
};

wordProgressSchema.methods.calculateMasteryLevel = function(this: WordProgressDocument): 'beginner' | 'intermediate' | 'advanced' | 'mastered' {
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

wordProgressSchema.methods.getRecommendedAction = function(this: WordProgressDocument): 'continue' | 'review' | 'skip' | 'intensive_practice' {
  const stats = this.getStudyStats();
  const daysSinceLastStudy = this.getDaysSinceLastStudy();
  
  if (stats.successRate >= 90 && this.study_streak >= 3) {
    return 'skip';
  } else if (stats.successRate < 30 || this.difficulty_rating >= 4.5) {
    return 'intensive_practice';
  } else if (daysSinceLastStudy >= 7 || stats.successRate < 70) {
    return 'review';
  } else {
    return 'continue';
  }
};

wordProgressSchema.methods.isEligibleForReview = function(this: WordProgressDocument): boolean {
  const daysSinceLastStudy = this.getDaysSinceLastStudy();
  const analytics = this.getLearningAnalytics();
  
  return daysSinceLastStudy >= analytics.optimalReviewInterval;
};

wordProgressSchema.methods.getDaysSinceLastStudy = function(this: WordProgressDocument): number {
  if (!this.last_studied_at) return Infinity;
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.last_studied_at.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Static methods
wordProgressSchema.statics.findByUserWordAndType = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument | null> {
  return this.findOne({
    user_id: userId,
    word_id: wordId,
    progress_type: type
  });
};

wordProgressSchema.statics.findOrCreate = async function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument> {
  let progress = await this.findByUserWordAndType(userId, wordId, type);
  
  if (!progress) {
    progress = new this({
      user_id: userId,
      word_id: wordId,
      progress_type: type
    });
    await progress.save();
  }
  
  return progress;
};

wordProgressSchema.statics.getCompletedWords = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    is_completed: true
  }).populate('word_id');
};

wordProgressSchema.statics.getIncompleteWords = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    is_completed: false
  }).populate('word_id');
};

wordProgressSchema.statics.getBookmarkedWords = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  tags?: string[]
): Promise<WordProgressDocument[]> {
  const filter: any = {
    user_id: userId,
    is_bookmarked: true
  };
  
  if (tags && tags.length > 0) {
    filter.bookmark_tags = { $in: tags };
  }
  
  return this.find(filter).populate('word_id');
};

wordProgressSchema.statics.getWordsNeedingReview = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  daysSince: number = 7
): Promise<WordProgressDocument[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSince);
  
  return this.find({
    user_id: userId,
    progress_type: type,
    $or: [
      { last_studied_at: { $lt: cutoffDate } },
      { last_studied_at: { $exists: false } }
    ]
  }).populate('word_id');
};

wordProgressSchema.statics.getUserWordProgress = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type?: ProgressType
): Promise<WordProgressDocument[]> {
  const filter: any = { user_id: userId };
  if (type) filter.progress_type = type;
  
  return this.find(filter).populate('word_id');
};

wordProgressSchema.statics.getStudyStats = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<any> {
  return this.aggregate([
    { $match: { user_id: userId, progress_type: type } },
    {
      $group: {
        _id: null,
        total_words: { $sum: 1 },
        completed_words: { $sum: { $cond: ["$is_completed", 1, 0] } },
        bookmarked_words: { $sum: { $cond: ["$is_bookmarked", 1, 0] } },
        total_tries: { $sum: "$try_count" },
        total_correct: { $sum: "$correct_count" },
        avg_tries: { $avg: "$try_count" },
        avg_success_rate: { 
          $avg: { 
            $cond: [
              { $gt: ["$try_count", 0] },
              { $divide: ["$correct_count", "$try_count"] },
              0
            ]
          }
        },
        total_time_spent: { $sum: "$time_spent_total" },
        avg_difficulty: { $avg: "$difficulty_rating" }
      }
    }
  ]);
};

wordProgressSchema.statics.getLevelProgress = function(
  this: WordProgressModel,
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
        as: 'word'
      }
    },
    { $unwind: '$word' },
    {
      $match: {
        user_id: userId,
        progress_type: type,
        'word.level': level
      }
    },
    {
      $group: {
        _id: '$word.step',
        total_words: { $sum: 1 },
        completed_words: { $sum: { $cond: ['$is_completed', 1, 0] } },
        avg_difficulty: { $avg: '$difficulty_rating' },
        total_time_spent: { $sum: '$time_spent_total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

wordProgressSchema.statics.getStudyStreak = async function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<number> {
  const recentProgress = await this.find({
    user_id: userId,
    progress_type: type,
    last_studied_at: { $exists: true }
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

wordProgressSchema.statics.bulkUpdateProgress = async function(
  this: WordProgressModel,
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
            progress_type: progressType
          },
          {
            $set: {
              is_completed: true,
              last_studied_at: new Date()
            },
            $inc: { try_count: 1, correct_count: 1 }
          }
        );
        modified = completedResult.modifiedCount;
        break;

      case 'mark_incomplete':
        const incompleteResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType
          },
          {
            $set: {
              is_completed: false,
              last_studied_at: new Date(),
              study_streak: 0
            },
            $inc: { try_count: 1 }
          }
        );
        modified = incompleteResult.modifiedCount;
        break;

      case 'bookmark':
        const bookmarkResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds }
          },
          {
            $set: { is_bookmarked: true }
          }
        );
        modified = bookmarkResult.modifiedCount;
        break;

      case 'unbookmark':
        const unbookmarkResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds }
          },
          {
            $set: { 
              is_bookmarked: false,
              bookmark_reason: undefined,
              bookmark_tags: []
            }
          }
        );
        modified = unbookmarkResult.modifiedCount;
        break;

      case 'reset_progress':
        const resetResult = await this.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType
          },
          {
            $set: {
              is_completed: false,
              try_count: 0,
              correct_count: 0,
              study_streak: 0,
              difficulty_rating: 3,
              time_spent_total: 0,
              study_history: [],
              last_studied_at: undefined,
              first_studied_at: undefined
            }
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

wordProgressSchema.statics.generateStudySessionSummary = async function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  sessionId: string,
  type: ProgressType
): Promise<StudySessionSummary> {
  // This would typically track session data in a separate collection
  // For now, we'll generate a summary based on recent activity
  const recentActivity = await this.find({
    user_id: userId,
    progress_type: type,
    last_studied_at: {
      $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
    }
  }).populate('word_id');

  const wordsStudied = recentActivity.length;
  const wordsCompleted = recentActivity.filter(w => w.is_completed).length;
  const totalTimeSpent = recentActivity.reduce((sum, w) => sum + w.time_spent_total, 0);
  const averageAccuracy = wordsStudied > 0 
    ? (recentActivity.reduce((sum, w) => sum + (w.correct_count / Math.max(w.try_count, 1)), 0) / wordsStudied) * 100
    : 0;

  const difficultWords = recentActivity
    .filter(w => w.difficulty_rating >= 4)
    .map(w => w.word_id);

  const easyWords = recentActivity
    .filter(w => w.difficulty_rating <= 2)
    .map(w => w.word_id);

  const newBookmarks = recentActivity.filter(w => w.is_bookmarked).length;

  return {
    sessionId,
    wordsStudied,
    wordsCompleted,
    totalTimeSpent,
    averageAccuracy,
    difficultWords,
    easyWords,
    newBookmarks
  };
};

wordProgressSchema.statics.getWeakestWords = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  limit: number = 10
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    try_count: { $gt: 0 }
  })
  .sort({
    difficulty_rating: -1,
    correct_count: 1,
    try_count: -1
  })
  .limit(limit)
  .populate('word_id');
};

wordProgressSchema.statics.getStrongestWords = function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  limit: number = 10
): Promise<WordProgressDocument[]> {
  return this.find({
    user_id: userId,
    progress_type: type,
    try_count: { $gt: 0 }
  })
  .sort({
    study_streak: -1,
    correct_count: -1,
    difficulty_rating: 1
  })
  .limit(limit)
  .populate('word_id');
};

wordProgressSchema.statics.analyzeStudyPatterns = function(
  this: WordProgressModel,
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
        last_studied_at: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$last_studied_at'
          }
        },
        daily_words_studied: { $sum: 1 },
        daily_words_completed: { $sum: { $cond: ['$is_completed', 1, 0] } },
        daily_time_spent: { $sum: '$time_spent_total' },
        avg_difficulty: { $avg: '$difficulty_rating' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

wordProgressSchema.statics.predictOptimalReviewTime = async function(
  this: WordProgressModel,
  userId: mongoose.Types.ObjectId,
  wordId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<number> {
  const progress = await this.findByUserWordAndType(userId, wordId, type);
  
  if (!progress) return 1; // Default to review tomorrow if no progress

  const analytics = progress.getLearningAnalytics();
  return analytics.optimalReviewInterval;
};

// Pre-save middleware to update timestamps and maintain data integrity
wordProgressSchema.pre("save", function(this: WordProgressDocument, next: Function) {
  if (this.isModified("is_completed") || this.isModified("try_count")) {
    this.last_studied_at = new Date();
  }
  
  // Ensure correct_count doesn't exceed try_count
  if (this.correct_count > this.try_count) {
    this.correct_count = this.try_count;
  }
  
  next();
});

// Create and export model
const WordProgress = mongoose.model<WordProgressDocument, WordProgressModel>("WordProgress", wordProgressSchema, "word_progress");

export default WordProgress;