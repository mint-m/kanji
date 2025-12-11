/**
 * Types Index
 *
 * Central export point for all custom types in the application.
 * This file provides a single import source for type consistency.
 *
 * Usage:
 *   import { LearningLevel, ProgressType, ApiResponse } from '../types';
 */

import { ObjectId } from 'mongoose';

// ============================================================================
// Common Base Types
// ============================================================================
export * from './common';

// ============================================================================
// API Types (Requests & Responses)
// ============================================================================
export * from './api';

// ============================================================================
// Service Types
// ============================================================================
export * from './services';

// ============================================================================
// Authentication Types
// ============================================================================
export * from './auth';

// ============================================================================
// Re-export commonly used types for convenience
// ============================================================================
export type {
  // Core types
  LearningLevel,
  ProgressType,
  StepRange,

  // Deck types
  DeckGenerationOptions,
  SessionStats,

  // Utility types
  ObjectId,
  Timestamps,
  PaginationParams,
} from './common';

export type {
  // Request types
  GenerateDeckRequest,
  CompleteWordRequest,
  CreateSessionRequest,

  // Response types
  ApiResponse,
  DeckGenerationResult,
  WordCompletionResult,
  CurrentDeckResponse,
  DeckWord,
} from './api';

export type {
  // Auth types
  JWTPayload,
  AuthResponse,
  UserSession,
} from './auth';
