import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { ProgressType, LearningLevel } from '../types/common';

// Word completion status
export type CompletionStatus = 'not_studied' | 'studying' | 'completed' | 'needs_review';

// Study result for individual word attempts
export interface StudyResult {
  isCorrect: boolean;
  timeSpent?: number; // milliseconds
  studiedAt: Date;
}

// Word study statistics
export interface WordStudyStats {
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  successRate: number;
  averageTimeSpent: number;
  lastStudied?: Date;
  firstStudied?: Date;
  studyStreak: number;
}

// Bookmark information
export interface BookmarkInfo {
  isBookmarked: boolean;
  bookmarkedAt?: Date;
  reason?: string; // Why was it bookmarked
  tags?: string[]; // Custom tags for organization
}

// Learning analytics for insights
export interface LearningAnalytics {
  retentionRate: number;
  forgettingCurve: number[];
  optimalReviewInterval: number; // days
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  recommendedAction: 'continue' | 'review' | 'skip' | 'intensive_practice';
}

// Bulk operations interface
export interface BulkWordOperation {
  wordIds: mongoose.Types.ObjectId[];
  action: 'mark_completed' | 'mark_incomplete' | 'bookmark' | 'unbookmark' | 'reset_progress';
  userId: mongoose.Types.ObjectId;
  progressType: ProgressType;
}

// Study session summary
export interface StudySessionSummary {
  sessionId: string;
  wordsStudied: number;
  wordsCompleted: number;
  totalTimeSpent: number;
  averageAccuracy: number;
  newBookmarks: number;
}

// WordProgress document interface
export interface WordProgressDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  word_id: mongoose.Types.ObjectId;
  progress_type: ProgressType;
  is_window_completed: boolean;
  try_count: number;
  correct_count: number;
  is_bookmarked: boolean;
  last_studied_at?: Date;
  first_studied_at?: Date;
  study_streak: number;
  time_spent_total: number; // milliseconds
  bookmark_reason?: string;
  bookmark_tags: string[];
  study_history: StudyResult[];
  created_at: Date;

  // Instance methods
  markCompleted(): void;
  markIncomplete(): void;
  recordStudyAttempt(result: StudyResult): void;
  toggleBookmark(reason?: string, tags?: string[]): boolean;
  updateStudyTime(timeSpent: number): void;
  resetProgress(): void;
  getStudyStats(): WordStudyStats;
  getBookmarkInfo(): BookmarkInfo;
  getLearningAnalytics(): LearningAnalytics;
  calculateMasteryLevel(): 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  getRecommendedAction(): 'continue' | 'review' | 'skip' | 'intensive_practice';
  isEligibleForReview(): boolean;
  getDaysSinceLastStudy(): number;
}

// WordProgress model interface with static methods
export interface WordProgressModel extends Model<WordProgressDocument> {
  findByUserWordAndType(
    userId: mongoose.Types.ObjectId,
    wordId: mongoose.Types.ObjectId,
    type: ProgressType
  ): Promise<WordProgressDocument | null>;

  findOrCreate(
    userId: mongoose.Types.ObjectId,
    wordId: mongoose.Types.ObjectId,
    type: ProgressType
  ): Promise<WordProgressDocument>;

  getCompletedWords(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<WordProgressDocument[]>;

  getIncompleteWords(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<WordProgressDocument[]>;

  resetWindowCompletionForWords(
    userId: mongoose.Types.ObjectId,
    wordIds: mongoose.Types.ObjectId[],
    progressType: ProgressType
  ): Promise<number>;

  getUnknownWordsFromDeck(
    userId: mongoose.Types.ObjectId,
    wordIds: mongoose.Types.ObjectId[],
    progressType: ProgressType
  ): Promise<mongoose.Types.ObjectId[]>;

  getBookmarkedWords(userId: mongoose.Types.ObjectId, tags?: string[]): Promise<WordProgressDocument[]>;

  getWordsNeedingReview(
    userId: mongoose.Types.ObjectId,
    type: ProgressType,
    daysSince?: number
  ): Promise<WordProgressDocument[]>;

  getUserWordProgress(userId: mongoose.Types.ObjectId, type?: ProgressType): Promise<WordProgressDocument[]>;

  getStudyStats(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<any>;

  getLevelProgress(userId: mongoose.Types.ObjectId, level: LearningLevel, type: ProgressType): Promise<any>;

  getStudyStreak(userId: mongoose.Types.ObjectId, type: ProgressType): Promise<number>;

  bulkUpdateProgress(operation: BulkWordOperation): Promise<{ modified: number; errors: any[] }>;

  generateStudySessionSummary(
    userId: mongoose.Types.ObjectId,
    sessionId: string,
    type: ProgressType
  ): Promise<StudySessionSummary>;

  getWeakestWords(userId: mongoose.Types.ObjectId, type: ProgressType, limit?: number): Promise<WordProgressDocument[]>;

  getStrongestWords(
    userId: mongoose.Types.ObjectId,
    type: ProgressType,
    limit?: number
  ): Promise<WordProgressDocument[]>;

  analyzeStudyPatterns(userId: mongoose.Types.ObjectId, type: ProgressType, days?: number): Promise<any>;

  predictOptimalReviewTime(
    userId: mongoose.Types.ObjectId,
    wordId: mongoose.Types.ObjectId,
    type: ProgressType
  ): Promise<number>;

  getBookmarkAnalytics(userId: mongoose.Types.ObjectId): Promise<any>;
}

export default WordProgressModel;
