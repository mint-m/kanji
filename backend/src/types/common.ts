/**
 * Common Base Types
 *
 * Central definition of shared types used across the application.
 * This ensures type consistency and eliminates duplication.
 */

import mongoose from 'mongoose';

// ============================================================================
// Core Learning Types
// ============================================================================

export const LEARNING_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'daily'] as const;
export type LearningLevel = (typeof LEARNING_LEVELS)[number];

/**
 * Progress session types
 * - main: Systematic progression through levels
 * - sub: Bookmark-focused review sessions
 */
export type ProgressType = 'main' | 'sub';

/**
 * Step range for sliding window system
 * Each level contains variable number of steps based on word count
 * Steps start at 1, max varies per level
 */
export interface StepRange {
  start: number;
  end: number;
}

// ============================================================================
// Deck & Progress Types
// ============================================================================

/**
 * Learning session statistics
 */
export interface SessionStats {
  totalWords: number;
  completedWords: number;
  remainingWords: number;
  progressPercentage: number;
  averageWordsPerStep: number;
  currentStep: number;
  totalSteps: number;
}

// ============================================================================
// Word Study Types
// ============================================================================

/**
 * Completion status for word progress
 */
export type CompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'mastered' | 'needs_review';

/**
 * Study result for word attempts
 */
export type StudyResult = 'correct' | 'incorrect' | 'partial' | 'skipped';

// ============================================================================
// User Preference Types
// ============================================================================

/**
 * Theme preferences
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Language preferences
 */
export type Language = 'ko' | 'en' | 'ja';

/**
 * User authentication types
 */
export type UserAuthType = 'google' | 'kakao' | 'local';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * MongoDB ObjectId type alias
 */
export type ObjectId = mongoose.Types.ObjectId;

/**
 * Timestamp fields for documents
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | 1 | -1;
}

/**
 * Date range filter
 */
export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a value is a valid LearningLevel
 */
export function isValidLearningLevel(value: any): value is LearningLevel {
  return (LEARNING_LEVELS as readonly string[]).includes(value);
}

/**
 * Check if a value is a valid ProgressType
 */
export function isValidProgressType(value: any): value is ProgressType {
  return ['main', 'sub'].includes(value);
}

/**
 * Check if step range is valid (basic validation only)
 * For actual existence validation, use Word.validateStepRange() in controllers
 */
export function isValidStepRange(range: StepRange): boolean {
  // start > end is valid: circular window (e.g. 9-1 wraps around)
  return range.start >= 1 && range.end >= 1;
}

/**
 * Get level order index (for sorting)
 */
export function getLevelOrder(level: LearningLevel): number {
  const order: Record<LearningLevel, number> = {
    daily: 6,
    N5: 5,
    N4: 4,
    N3: 3,
    N2: 2,
    N1: 1,
  };
  return order[level];
}

/**
 * Convert legacy numeric level to N-prefix format
 * @deprecated Use for migration only
 */
export function convertLegacyLevel(level: number | string): LearningLevel {
  const levelMap: Record<number, LearningLevel> = {
    5: 'N5',
    4: 'N4',
    3: 'N3',
    2: 'N2',
    1: 'N1',
  };

  const numLevel = typeof level === 'number' ? level : parseInt(level, 10);
  return levelMap[numLevel] || 'N5';
}
