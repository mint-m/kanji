/**
 * Checkpoint Service Types
 *
 * Type definitions for checkpoint management service
 */

import mongoose from 'mongoose';
import { LearningLevel, ProgressType, StepRange, ObjectId } from '../common';
import { DeckWindow } from './slidingWindow';

// ============================================================================
// Checkpoint Data Types
// ============================================================================

/**
 * Complete checkpoint data structure
 */
export interface CheckpointData {
  userId: ObjectId;
  progressType: ProgressType;
  level: LearningLevel;
  currentWindow: DeckWindow;
  currentIndex: number;
  windowHistory: StepRange[];
  completedWindows: number;
  shuffledOrder: ObjectId[];

  sessionStats: {
    wordsCompleted: number;
    totalWords: number;
    sessionStartTime: Date;
    lastActivityTime: Date;
  };

  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Checkpoint restore result
 */
export interface CheckpointRestoreResult {
  success: boolean;
  checkpoint: CheckpointData | null;
  message: string;
  requiresMigration?: boolean;
  migrationSteps?: string[];
}

/**
 * Checkpoint validation result
 */
export interface CheckpointValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canRestore: boolean;
}

// ============================================================================
// Checkpoint Query Options
// ============================================================================

/**
 * Options for querying checkpoints
 */
export interface CheckpointQueryOptions {
  userId: ObjectId;
  progressType?: ProgressType;
  level?: LearningLevel;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Checkpoint filter criteria
 */
export interface CheckpointFilter {
  userId: ObjectId;
  progressType?: ProgressType;
  level?: LearningLevel;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isActive?: boolean;
}

// ============================================================================
// Checkpoint Management Types
// ============================================================================

/**
 * Checkpoint save options
 */
export interface CheckpointSaveOptions {
  overwriteExisting?: boolean;
  createBackup?: boolean;
  validateBeforeSave?: boolean;
}

/**
 * Checkpoint restore options
 */
export interface CheckpointRestoreOptions {
  validateBeforeRestore?: boolean;
  createBackupBefore?: boolean;
  force?: boolean; // Restore even if validation fails
}

/**
 * Checkpoint cleanup criteria
 */
export interface CheckpointCleanupCriteria {
  olderThan?: Date;
  progressType?: ProgressType;
  keepMostRecent?: number; // Keep N most recent checkpoints per user
}

/**
 * Checkpoint cleanup result
 */
export interface CheckpointCleanupResult {
  deleted: number;
  retained: number;
  errors: Array<{
    checkpointId: string;
    error: string;
  }>;
}

// ============================================================================
// Checkpoint Migration Types
// ============================================================================

/**
 * Checkpoint migration data
 */
export interface CheckpointMigrationData {
  checkpointId: string;
  fromVersion: string;
  toVersion: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    transformation: string;
  }>;
  migrationDate: Date;
}

/**
 * Checkpoint migration result
 */
export interface CheckpointMigrationResult {
  success: boolean;
  checkpointId: string;
  migrationData: CheckpointMigrationData;
  errors?: string[];
}
