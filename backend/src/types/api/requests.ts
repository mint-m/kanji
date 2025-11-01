/**
 * API Request Types
 *
 * Type definitions for API request payloads.
 * These match the frontend's request types for consistency.
 */

import { LearningLevel, ProgressType, StepRange, DeckGenerationOptions, DifficultyRating } from '../common';

// ============================================================================
// Authentication Requests
// ============================================================================

/**
 * Google OAuth authorization code request
 */
export interface GoogleAuthCodeRequest {
  code: string;
  redirect_uri?: string;
}

/**
 * Google OAuth token login request
 */
export interface GoogleTokenLoginRequest {
  accessToken: string;
}

// ============================================================================
// Deck Requests
// ============================================================================

/**
 * Request to generate a new sliding window deck
 */
export interface GenerateDeckRequest {
  level: LearningLevel;
  steps: StepRange;
  progressType: ProgressType;
  options?: DeckGenerationOptions;
}

/**
 * Request to mark a single word as completed
 */
export interface CompleteWordRequest {
  wordId: string;
  isCorrect: boolean;
  timeSpent?: number; // milliseconds
  difficulty?: DifficultyRating;
}

/**
 * Request to complete multiple words in bulk
 */
export interface BulkCompleteWordsRequest {
  completions: CompleteWordRequest[];
}

/**
 * Request to complete an entire deck
 */
export interface CompleteDeckRequest {
  autoGenerateNext?: boolean;
  sessionFeedback?: SessionFeedback;
}

/**
 * Session feedback from user
 */
export interface SessionFeedback {
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  enjoyment: number; // 1-5
  notes?: string;
}

// ============================================================================
// Progress Requests
// ============================================================================

/**
 * Request to create a new learning session
 */
export interface CreateSessionRequest {
  type: ProgressType;
  level: LearningLevel;
  steps: StepRange;
}

/**
 * Request to update current index in session
 */
export interface UpdateIndexRequest {
  action: 'next' | 'previous' | 'jump';
  index?: number; // Required when action is 'jump'
}

/**
 * Request to switch between main/sub sessions
 */
export interface SwitchSessionRequest {
  fromType: ProgressType;
  toType: ProgressType;
}

// ============================================================================
// Word Progress Requests
// ============================================================================

/**
 * Request to record a study attempt
 */
export interface RecordAttemptRequest {
  wordId: string;
  progressType: ProgressType;
  isCorrect: boolean;
  timeSpent?: number;
  difficulty?: DifficultyRating;
}

/**
 * Request to toggle word bookmark
 */
export interface ToggleBookmarkRequest {
  wordId: string;
  reason?: string; // Why bookmarked
  tags?: string[]; // Custom tags
}

/**
 * Request for bulk word operations
 */
export interface BulkWordOperationRequest {
  wordIds: string[];
  action: 'mark_completed' | 'mark_incomplete' | 'bookmark' | 'unbookmark' | 'reset_progress';
  progressType: ProgressType;
}

// ============================================================================
// Word Search Requests
// ============================================================================

/**
 * Request to search words
 */
export interface SearchWordsRequest {
  level?: LearningLevel;
  step?: number;
  stepRange?: StepRange;
  searchTerm?: string;
  partsOfSpeech?: string[];
  hasKanji?: boolean;
  limit?: number;
}

/**
 * Request to get random words
 */
export interface GetRandomWordsRequest {
  level?: LearningLevel;
  count?: number;
  stepRange?: StepRange;
}

// ============================================================================
// User Preferences Requests
// ============================================================================

/**
 * Request to update user preferences
 */
export interface UpdatePreferencesRequest {
  studyReminders?: boolean;
  reminderTime?: string; // HH:MM format
  dailyGoal?: number;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'ko' | 'en' | 'ja';
  soundEffects?: boolean;
  autoPlayAudio?: boolean;
}

/**
 * Request to update user profile
 */
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  studyGoals?: string[];
  timezone?: string;
}
