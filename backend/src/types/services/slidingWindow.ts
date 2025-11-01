/**
 * Sliding Window Service Types
 *
 * Type definitions for sliding window deck generation service
 */

import mongoose from 'mongoose';
import { LearningLevel, ProgressType, StepRange, ObjectId } from '../common';

// ============================================================================
// Window Configuration Types
// ============================================================================

/**
 * Window configuration for a level
 */
export interface WindowConfig {
  windowSize: number; // Number of steps in window (default: 3)
  maxStep: number;    // Maximum step for this level
  minStep: number;    // Minimum step for this level (usually 1)
}

/**
 * Deck window definition
 */
export interface DeckWindow {
  level: LearningLevel;
  steps: StepRange;
  wordIds: ObjectId[];
  windowIndex: number;    // Position in sequence (0-based)
  isCircular: boolean;    // Whether this window wraps around level boundary
  totalWindows: number;   // Total windows available for this level
}

/**
 * Window transition information
 */
export interface WindowTransition {
  from: StepRange;
  to: StepRange;
  transitionType: 'forward' | 'backward' | 'circular' | 'jump';
  isLevelComplete: boolean;
}

// ============================================================================
// Window Checkpoint Types
// ============================================================================

/**
 * Window checkpoint for user progress tracking
 */
export interface WindowCheckpoint {
  userId: ObjectId;
  progressType: ProgressType;
  level: LearningLevel;
  currentWindow: DeckWindow;
  windowHistory: StepRange[];
  completedWindows: number;
  totalProgressWindows: number;
  isLevelCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Window Generation Types
// ============================================================================

/**
 * Options for window generation
 */
export interface WindowGenerationOptions {
  excludeCompleted?: boolean;
  prioritizeBookmarked?: boolean;
  shuffleOrder?: boolean;
  maxWords?: number;
  forceRefresh?: boolean; // Regenerate even if cached
}

/**
 * Window generation result
 */
export interface WindowGenerationResult {
  window: DeckWindow;
  statistics: {
    totalWords: number;
    excludedWords: number;
    bookmarkedWords: number;
    generationTime: number; // milliseconds
  };
  cacheHit: boolean;
}

// ============================================================================
// Window Analysis Types
// ============================================================================

/**
 * Window statistics for a level
 */
export interface WindowStatistics {
  level: LearningLevel;
  totalWindows: number;
  averageWordsPerWindow: number;
  windowDistribution: Array<{
    windowIndex: number;
    steps: StepRange;
    wordCount: number;
  }>;
  circularWindows: number;
}

/**
 * Window transition map for navigation
 */
export interface WindowTransitionMap {
  level: LearningLevel;
  windows: StepRange[];
  transitions: Array<{
    from: number; // windowIndex
    to: number;   // windowIndex
    type: 'forward' | 'circular';
  }>;
  totalSteps: number;
}

// ============================================================================
// Window Validation Types
// ============================================================================

/**
 * Window validation result
 */
export interface WindowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Step range validation info
 */
export interface StepRangeValidation {
  isValid: boolean;
  errors: string[];
  normalizedRange?: StepRange; // Corrected range if fixable
}

// ============================================================================
// Window Progress Types
// ============================================================================

/**
 * User's progress within a window
 */
export interface WindowProgress {
  userId: ObjectId;
  progressType: ProgressType;
  window: DeckWindow;
  currentIndex: number;
  completedWords: number;
  totalWords: number;
  startedAt: Date;
  lastActivityAt: Date;
  estimatedCompletion?: Date;
}

/**
 * Window completion summary
 */
export interface WindowCompletionSummary {
  window: DeckWindow;
  completionPercentage: number;
  wordsCompleted: number;
  totalWords: number;
  timeSpent: number; // milliseconds
  averageTimePerWord: number;
  successRate: number;
  canMoveToNext: boolean;
  nextWindow?: StepRange;
}

// ============================================================================
// Circular Window Types
// ============================================================================

/**
 * Circular window configuration
 */
export interface CircularWindowConfig {
  level: LearningLevel;
  windowSize: number;
  maxStep: number;
  wrapAroundEnabled: boolean;
}

/**
 * Circular window detection result
 */
export interface CircularWindowInfo {
  isCircular: boolean;
  startStep: number;
  endStep: number;
  wrapsAtStep: number; // The step where wrapping occurs
  beforeWrap: StepRange;
  afterWrap: StepRange;
}
