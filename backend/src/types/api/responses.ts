/**
 * API Response Types
 *
 * Type definitions for API response payloads.
 * These match the frontend's expected response types.
 */

import mongoose from 'mongoose';
import { LearningLevel, ProgressType, StepRange, SessionStats, DeckGenerationOptions, ObjectId } from '../common';

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[]; // Validation errors
}

// ============================================================================
// Authentication Responses
// ============================================================================

/**
 * Response from Google OAuth token exchange
 */
export interface GoogleAuthTokenResponse {
  success: boolean;
  accessToken: string;
  idToken?: string;
}

/**
 * Response from login with user data
 */
export interface LoginResponse {
  success: boolean;
  user: {
    _id: string;
    email: string;
    name: string;
    type: string;
    profilePicture?: string;
  };
  token: string;
}

// ============================================================================
// Deck Responses
// ============================================================================

/**
 * Response from deck generation
 */
export interface DeckGenerationResult {
  deckId: string;
  words: any[]; // Full word documents
  totalWords: number;
  level: LearningLevel;
  steps: StepRange;
  excludedCompleted: number;
  prioritizedBookmarks: number;
  options: DeckGenerationOptions;
  generatedAt: Date;
  estimatedStudyTime: number; // minutes
}

/**
 * Response from word completion
 */
export interface WordCompletionResult {
  wordId: ObjectId;
  isCorrect: boolean;
  timeSpent?: number;
  previousAttempts: number;
  newMasteryLevel?: string;
  shouldRepeat: boolean;
}

/**
 * Full response from completing a word
 */
export interface CompleteWordResponse {
  completion: WordCompletionResult;
  wordProgress: {
    totalAttempts: number;
    successRate: number;
    studyStreak: number;
    masteryLevel: string;
    recommendedAction: string;
    isBookmarked: boolean;
  };
  currentIndex: number;
  isSessionCompleted: boolean;
}

/**
 * Response from current deck query
 */
export interface CurrentDeckResponse {
  deckId: string;
  level: LearningLevel;
  steps: StepRange;
  progressType: ProgressType;
  words: DeckWord[];
  currentIndex: number;
  sessionStats: SessionStats;
  deckStatus: {
    isCompleted: boolean;
    canMoveToNext: boolean;
    completionPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Word with progress information for deck display
 */
export interface DeckWord {
  // Word fields
  _id: string;
  origin_entry_id: string;
  entry: string;
  pron?: string;
  level: LearningLevel;
  step: number;
  means: string[];
  parts: string[];

  // Deck-specific fields
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isBookmarked: boolean;

  // Study statistics
  studyStats?: {
    tryCount: number;
    correctCount: number;
    successRate: number;
    timeSpent: number;
  };

  recommendedAction?: 'continue' | 'review' | 'intensive_practice' | 'skip';
}

/**
 * Deck statistics response
 */
export interface DeckStatsResponse {
  progressType: ProgressType;
  level: LearningLevel;
  steps: StepRange;
  totalWords: number;
  completedWords: number;
  bookmarkedWords: number;
  averageSuccessRate: number;
  averageTimePerWord: number;
  masteryDistribution: Record<string, number>;
  recentActivity: Array<{
    date: Date;
    wordsStudied: number;
    successRate: number;
  }>;
}

// ============================================================================
// Progress Responses
// ============================================================================

/**
 * Response from learning statistics query
 */
export interface LearningStatsResponse {
  progressType: ProgressType;
  sessions: number;
  totalWords: number;
  completedWords: number;
  levels: LearningLevel[];
  avgProgress: number;
}

/**
 * User progress overview
 */
export interface UserProgressOverview {
  main: {
    currentLevel: LearningLevel;
    currentSteps: StepRange;
    completionPercentage: number;
    wordsStudied: number;
  } | null;
  sub: {
    currentLevel: LearningLevel;
    currentSteps: StepRange;
    completionPercentage: number;
    wordsStudied: number;
  } | null;
  overallStats: {
    totalWordsStudied: number;
    totalTimeSpent: number;
    currentStreak: number;
    longestStreak: number;
    studyDaysCount: number;
  };
}

// ============================================================================
// Word Responses
// ============================================================================

/**
 * Word statistics response
 */
export interface WordStatisticsResponse {
  level?: LearningLevel;
  totalWords: number;
  wordsByLevel: Record<LearningLevel, number>;
  wordsByStep: Array<{ step: number; count: number }>;
  averageWordsPerStep: number;
}

/**
 * Word search results
 */
export interface WordSearchResponse {
  words: any[];
  total: number;
  page?: number;
  limit?: number;
  hasMore: boolean;
}

// ============================================================================
// Checkpoint Responses
// ============================================================================

/**
 * Checkpoint save result
 */
export interface CheckpointSaveResponse {
  success: boolean;
  checkpointId: string;
  message: string;
}

/**
 * Checkpoint restore result
 */
export interface CheckpointRestoreResponse {
  success: boolean;
  checkpoint: any;
  message: string;
  requiresMigration?: boolean;
  migrationSteps?: string[];
}

// ============================================================================
// User Responses
// ============================================================================

/**
 * User profile response
 */
export interface UserProfileResponse {
  _id: string;
  email: string;
  name: string;
  type: string;
  profile: {
    displayName?: string;
    profilePicture?: string;
    bio?: string;
    studyGoals?: string[];
    joinedAt: Date;
    lastActiveAt?: Date;
  };
  preferences: {
    studyReminders: boolean;
    reminderTime?: string;
    dailyGoal: number;
    theme: string;
    language: string;
    soundEffects: boolean;
    autoPlayAudio: boolean;
  };
  statistics: {
    totalWordsStudied: number;
    totalTimeSpent: number;
    currentStreak: number;
    longestStreak: number;
    levelsCompleted: LearningLevel[];
    studyDaysCount: number;
  };
}

/**
 * User statistics response
 */
export interface UserStatsResponse {
  totalWordsStudied: number;
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  levelsCompleted: LearningLevel[];
  averageSessionTime: number;
  studyDaysCount: number;
  favoriteStudyTime?: string;
}
