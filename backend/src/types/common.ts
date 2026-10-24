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
 * Learning session statistics (현재 패스 기준)
 */
export interface SessionStats {
  totalWords: number;
  completedWords: number;
  remainingWords: number;
  progressPercentage: number;
}

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
