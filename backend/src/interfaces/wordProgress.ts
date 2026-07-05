import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { ProgressType } from '../types/common';

export interface StudyResult {
  isCorrect: boolean;
  timeSpent?: number;
  studiedAt: Date;
}

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

export interface BookmarkInfo {
  isBookmarked: boolean;
  bookmarkedAt?: Date;
  reason?: string;
  tags?: string[];
}

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
  time_spent_total: number;
  bookmark_reason?: string;
  bookmark_tags: string[];
  bookmarked_at?: Date;
  created_at: Date;

  markCompleted(): void;
  markIncomplete(): void;
  recordStudyAttempt(result: StudyResult): void;
  toggleBookmark(reason?: string, tags?: string[]): boolean;
  getStudyStats(): WordStudyStats;
  getBookmarkInfo(): BookmarkInfo;
  calculateMasteryLevel(): 'beginner' | 'intermediate' | 'advanced' | 'mastered';
  getRecommendedAction(): 'continue' | 'review' | 'skip';
  getDaysSinceLastStudy(): number;
}

export interface WordProgressModel extends Model<WordProgressDocument> {
  findOrCreate(
    userId: mongoose.Types.ObjectId,
    wordId: mongoose.Types.ObjectId,
    type: ProgressType
  ): Promise<WordProgressDocument>;

  resetWindowCompletionForWords(
    userId: mongoose.Types.ObjectId,
    wordIds: mongoose.Types.ObjectId[],
    progressType: ProgressType
  ): Promise<number>;
}

export default WordProgressModel;
