import mongoose from 'mongoose';
import { LearningLevel, StepRange, ProgressType } from '../types/common';
import { DeckWindow, WindowCheckpoint } from '../types/services/slidingWindow';
import {
  CheckpointData,
  CheckpointRestoreResult,
  CheckpointValidationResult,
} from '../types/services/checkpoint';
import CheckpointConfig from '../config/checkpoint';

// Re-export types for backwards compatibility
export type { CheckpointData, CheckpointRestoreResult, CheckpointValidationResult };

export class CheckpointService {
  private static readonly CHECKPOINT_VERSION = '1.0.0';
  private static readonly MAX_CHECKPOINT_AGE_DAYS = 30;
  private static readonly MAX_CHECKPOINTS_PER_USER = 10;

  /**
   * Save a checkpoint for user progress
   */
  static async saveCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    currentWindow: DeckWindow,
    currentIndex: number,
    shuffledOrder: mongoose.Types.ObjectId[],
    windowHistory: StepRange[] = [],
    completedWindows: number = 0
  ): Promise<CheckpointData> {
    const now = new Date();
    
    const checkpoint: CheckpointData = {
      userId,
      progressType,
      level: currentWindow.level,
      currentWindow,
      currentIndex,
      windowHistory: [...windowHistory],
      completedWindows,
      shuffledOrder: [...shuffledOrder],
      sessionStats: {
        wordsCompleted: currentIndex,
        totalWords: shuffledOrder.length,
        sessionStartTime: now,
        lastActivityTime: now,
      },
      metadata: {
        version: this.CHECKPOINT_VERSION,
        createdAt: now,
        updatedAt: now,
      },
    };

    // Store checkpoint in database or cache
    await this.persistCheckpoint(checkpoint);

    // Clean up old checkpoints
    await this.cleanupOldCheckpoints(userId, progressType);

    CheckpointConfig.log(
      `Checkpoint saved successfully for user ${userId}, type ${progressType}, index ${currentIndex}/${shuffledOrder.length}`
    );

    return checkpoint;
  }

  /**
   * Restore checkpoint from storage
   */
  static async restoreCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    checkpointId?: string
  ): Promise<CheckpointRestoreResult> {
    try {
      // Get the most recent checkpoint if no specific ID provided
      const checkpoint = checkpointId 
        ? await this.getCheckpointById(checkpointId)
        : await this.getLatestCheckpoint(userId, progressType);

      if (!checkpoint) {
        return {
          success: false,
          checkpoint: null,
          message: 'No checkpoint found for restoration',
        };
      }

      // Validate checkpoint before restoration
      const validation = await this.validateCheckpoint(checkpoint);
      
      if (!validation.canRestore) {
        return {
          success: false,
          checkpoint,
          message: `Checkpoint validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Check if migration is needed
      const requiresMigration = await this.checkMigrationNeeded(checkpoint);
      
      if (requiresMigration.needed) {
        return {
          success: false,
          checkpoint,
          message: 'Checkpoint requires migration before restoration',
          requiresMigration: true,
          migrationSteps: requiresMigration.steps,
        };
      }

      CheckpointConfig.log(
        `Checkpoint restored successfully for user ${userId}, type ${progressType}, index ${checkpoint.currentIndex}`
      );

      return {
        success: true,
        checkpoint,
        message: 'Checkpoint restored successfully',
      };

    } catch (error) {
      CheckpointConfig.logError('Checkpoint restoration error', error);
      return {
        success: false,
        checkpoint: null,
        message: `Failed to restore checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate checkpoint data integrity
   */
  static async validateCheckpoint(checkpoint: CheckpointData): Promise<CheckpointValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!checkpoint.userId) errors.push('Missing user ID');
    if (!checkpoint.progressType) errors.push('Missing progress type');
    if (!checkpoint.level) errors.push('Missing level');
    if (!checkpoint.currentWindow) errors.push('Missing current window');
    if (!checkpoint.shuffledOrder) errors.push('Missing shuffled order');

    // Validate progress type
    if (!['main', 'sub'].includes(checkpoint.progressType)) {
      errors.push('Invalid progress type');
    }

    // Validate level
    if (!['N5', 'N4', 'N3', 'N2', 'N1'].includes(checkpoint.level)) {
      errors.push('Invalid level');
    }

    // Validate current index
    if (checkpoint.currentIndex < 0 || checkpoint.currentIndex > checkpoint.shuffledOrder.length) {
      errors.push('Invalid current index');
    }

    // Check window data consistency
    if (checkpoint.currentWindow) {
      if (checkpoint.currentWindow.level !== checkpoint.level) {
        errors.push('Window level mismatch');
      }
      
      if (checkpoint.currentWindow.wordIds.length !== checkpoint.shuffledOrder.length) {
        warnings.push('Word count mismatch between window and shuffled order');
      }
    }

    // Check checkpoint age
    const ageInDays = (Date.now() - checkpoint.metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > this.MAX_CHECKPOINT_AGE_DAYS) {
      warnings.push(`Checkpoint is ${Math.round(ageInDays)} days old`);
    }

    // Validate version compatibility
    if (checkpoint.metadata.version !== this.CHECKPOINT_VERSION) {
      warnings.push(`Version mismatch: checkpoint v${checkpoint.metadata.version}, current v${this.CHECKPOINT_VERSION}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canRestore: errors.length === 0,
    };
  }

  /**
   * Update existing checkpoint with new progress
   */
  static async updateCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    updates: Partial<CheckpointData>
  ): Promise<CheckpointData | null> {
    const existingCheckpoint = await this.getLatestCheckpoint(userId, progressType);
    
    if (!existingCheckpoint) {
      return null;
    }

    const updatedCheckpoint: CheckpointData = {
      ...existingCheckpoint,
      ...updates,
      metadata: {
        ...existingCheckpoint.metadata,
        updatedAt: new Date(),
      },
    };

    await this.persistCheckpoint(updatedCheckpoint);
    return updatedCheckpoint;
  }

  /**
   * Get all checkpoints for a user
   */
  static async getUserCheckpoints(
    userId: mongoose.Types.ObjectId,
    progressType?: ProgressType,
    limit: number = 10
  ): Promise<CheckpointData[]> {
    // Implementation would query database/cache
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Delete checkpoint
   */
  static async deleteCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType,
    checkpointId?: string
  ): Promise<boolean> {
    try {
      if (checkpointId) {
        return await this.deleteCheckpointById(checkpointId);
      } else {
        return await this.deleteLatestCheckpoint(userId, progressType);
      }
    } catch (error) {
      console.error('Checkpoint deletion error:', error);
      return false;
    }
  }

  /**
   * Create checkpoint from current UserProgress state
   */
  static async createCheckpointFromProgress(userProgress: any): Promise<CheckpointData> {
    const checkpoint = await this.saveCheckpoint(
      userProgress.user_id,
      userProgress.progress_type,
      {
        level: userProgress.current_level,
        steps: userProgress.steps,
        wordIds: userProgress.shuffled_order,
        windowIndex: 0, // Would be calculated based on steps
        isCircular: userProgress.steps.start > userProgress.steps.end,
        totalWindows: 0, // Would be calculated
      },
      userProgress.current_index,
      userProgress.shuffled_order,
      [], // Window history would be tracked separately
      0 // Completed windows would be tracked separately
    );

    return checkpoint;
  }

  /**
   * Restore UserProgress from checkpoint
   */
  static async restoreProgressFromCheckpoint(
    checkpoint: CheckpointData,
    userProgressModel: any
  ): Promise<any> {
    // Create or update UserProgress document
    const progressData = {
      user_id: checkpoint.userId,
      progress_type: checkpoint.progressType,
      current_level: checkpoint.level,
      steps: checkpoint.currentWindow.steps,
      shuffled_order: checkpoint.shuffledOrder,
      current_index: checkpoint.currentIndex,
      created_at: checkpoint.metadata.createdAt,
      updated_at: new Date(),
    };

    return await userProgressModel.findOneAndUpdate(
      {
        user_id: checkpoint.userId,
        progress_type: checkpoint.progressType,
      },
      progressData,
      { upsert: true, new: true }
    );
  }

  /**
   * Check if checkpoint migration is needed
   */
  private static async checkMigrationNeeded(checkpoint: CheckpointData): Promise<{
    needed: boolean;
    steps: string[];
  }> {
    const steps: string[] = [];
    
    // Check version compatibility
    if (checkpoint.metadata.version !== this.CHECKPOINT_VERSION) {
      steps.push(`Migrate from version ${checkpoint.metadata.version} to ${this.CHECKPOINT_VERSION}`);
    }

    // Check data structure changes
    if (!checkpoint.currentWindow.windowIndex) {
      steps.push('Calculate window index for current steps');
    }

    if (!checkpoint.sessionStats) {
      steps.push('Initialize session statistics');
    }

    return {
      needed: steps.length > 0,
      steps,
    };
  }

  /**
   * Persist checkpoint to storage using MongoDB
   */
  private static async persistCheckpoint(checkpoint: CheckpointData): Promise<void> {
    // Import Checkpoint model dynamically to avoid circular dependency
    const Checkpoint = (await import('../models/checkpoint')).default;

    // Deactivate old checkpoints for this user/type
    await Checkpoint.deactivateAllForUser(checkpoint.userId, checkpoint.progressType);

    // Create new checkpoint
    await Checkpoint.createCheckpoint(
      checkpoint.userId,
      checkpoint.progressType,
      checkpoint.currentWindow,
      checkpoint.currentIndex,
      checkpoint.shuffledOrder,
      checkpoint.windowHistory,
      checkpoint.completedWindows
    );

    console.log(`Checkpoint saved for user ${checkpoint.userId}, type ${checkpoint.progressType}`);
  }

  /**
   * Get checkpoint by ID from database
   */
  private static async getCheckpointById(checkpointId: string): Promise<CheckpointData | null> {
    const Checkpoint = (await import('../models/checkpoint')).default;

    try {
      const objectId = new mongoose.Types.ObjectId(checkpointId);
      const checkpointDoc = await Checkpoint.findOne({
        _id: objectId,
        is_active: true,
      });

      if (!checkpointDoc) return null;

      return this.convertDocumentToCheckpointData(checkpointDoc);
    } catch (error) {
      console.error('Error fetching checkpoint by ID:', error);
      return null;
    }
  }

  /**
   * Get latest checkpoint for user and progress type from database
   */
  private static async getLatestCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType
  ): Promise<CheckpointData | null> {
    const Checkpoint = (await import('../models/checkpoint')).default;

    try {
      const checkpointDoc = await Checkpoint.findLatestByUser(userId, progressType);

      if (!checkpointDoc) return null;

      return this.convertDocumentToCheckpointData(checkpointDoc);
    } catch (error) {
      console.error('Error fetching latest checkpoint:', error);
      return null;
    }
  }

  /**
   * Clean up old checkpoints beyond MAX_CHECKPOINTS_PER_USER
   */
  private static async cleanupOldCheckpoints(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType
  ): Promise<void> {
    const Checkpoint = (await import('../models/checkpoint')).default;

    try {
      const deletedCount = await Checkpoint.cleanupOldCheckpointsForUser(
        userId,
        progressType,
        this.MAX_CHECKPOINTS_PER_USER
      );

      if (deletedCount > 0) {
        CheckpointConfig.log(`Cleaned up ${deletedCount} old checkpoints for user ${userId}, type ${progressType}`);
      }
    } catch (error) {
      CheckpointConfig.logError('Error cleaning up old checkpoints', error);
    }
  }

  /**
   * Delete checkpoint by ID
   */
  private static async deleteCheckpointById(checkpointId: string): Promise<boolean> {
    const Checkpoint = (await import('../models/checkpoint')).default;

    try {
      const objectId = new mongoose.Types.ObjectId(checkpointId);
      const result = await Checkpoint.deleteOne({ _id: objectId });
      return (result.deletedCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting checkpoint by ID:', error);
      return false;
    }
  }

  /**
   * Delete latest checkpoint
   */
  private static async deleteLatestCheckpoint(
    userId: mongoose.Types.ObjectId,
    progressType: ProgressType
  ): Promise<boolean> {
    const Checkpoint = (await import('../models/checkpoint')).default;

    try {
      const checkpointDoc = await Checkpoint.findLatestByUser(userId, progressType);
      if (!checkpointDoc) return false;

      const result = await Checkpoint.deleteOne({ _id: checkpointDoc._id });
      return (result.deletedCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting latest checkpoint:', error);
      return false;
    }
  }

  /**
   * Convert Checkpoint document to CheckpointData format
   */
  private static convertDocumentToCheckpointData(doc: any): CheckpointData {
    return {
      userId: doc.user_id,
      progressType: doc.progress_type,
      level: doc.level,
      currentWindow: {
        level: doc.current_window.level,
        steps: doc.current_window.steps,
        wordIds: doc.current_window.word_ids,
        windowIndex: doc.current_window.window_index,
        isCircular: doc.current_window.is_circular,
        totalWindows: doc.current_window.total_windows,
      },
      currentIndex: doc.current_index,
      windowHistory: doc.window_history,
      completedWindows: doc.completed_windows,
      shuffledOrder: doc.shuffled_order,
      sessionStats: {
        wordsCompleted: doc.session_stats.words_completed,
        totalWords: doc.session_stats.total_words,
        sessionStartTime: doc.session_stats.session_start_time,
        lastActivityTime: doc.session_stats.last_activity_time,
      },
      metadata: {
        version: doc.version,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      },
    };
  }

  /**
   * Generate checkpoint summary for display
   */
  static generateCheckpointSummary(checkpoint: CheckpointData): {
    level: LearningLevel;
    progressType: ProgressType;
    windowInfo: string;
    progress: string;
    lastActivity: string;
    isCircular: boolean;
  } {
    const { currentWindow, currentIndex, shuffledOrder, sessionStats } = checkpoint;
    
    return {
      level: checkpoint.level,
      progressType: checkpoint.progressType,
      windowInfo: `Steps ${currentWindow.steps.start}-${currentWindow.steps.end}`,
      progress: `${currentIndex}/${shuffledOrder.length} words (${Math.round((currentIndex / shuffledOrder.length) * 100)}%)`,
      lastActivity: sessionStats.lastActivityTime.toISOString(),
      isCircular: currentWindow.isCircular,
    };
  }
}

export default CheckpointService;