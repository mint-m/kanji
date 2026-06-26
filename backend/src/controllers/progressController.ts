import { Response } from 'express';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProgressType, LearningLevel, StepRange } from '../types';
// Interface for learning statistics aggregate result
interface LearningStatsItem {
  _id: ProgressType;
  sessions: number;
  totalWords: number;
  completedWords: number;
  levels: LearningLevel[];
  avgProgress: number;
}

/**
 * Get user's current progress for a specific session type (main/sub)
 */
export const getUserProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    if (!['main', 'sub'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid progress type. Must be "main" or "sub"',
      });
      return;
    }

    const progress = await UserCheckpoint.findByUserAndType(userId, type);

    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No ${type} progress found. Create a new session first.`,
      });
      return;
    }

    // Populate current word details
    await progress.populate('shuffled_order');

    res.status(200).json({
      success: true,
      data: {
        progress,
        sessionStats: progress.getSessionStats(),
        currentWord: progress.getCurrentWord(),
        remainingWords: progress.getRemainingWords().length,
        canMoveToNextWindow: await progress.canMoveToNextWindow(userId, type),
        restoredFromCheckpoint: !progress, // Flag if restored
      },
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user progress',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Create new learning session (main/sub)
 */
export const createSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, level, steps } = req.body as {
      type: ProgressType;
      level: LearningLevel;
      steps: StepRange;
    };
    const userId = req.user!._id;

    // Check if session already exists
    const existingProgress = await UserCheckpoint.findByUserAndType(userId, type);

    if (existingProgress) {
      res.status(409).json({
        success: false,
        message: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } session already exists. Complete or reset current session first.`,
        data: { existingProgress },
      });
      return;
    }

    // Validate step range for the level
    const isValidRange = await Word.validateStepRange(level, steps.start, steps.end);
    if (!isValidRange) {
      res.status(400).json({
        success: false,
        message: `Invalid step range for level ${level}. Check available steps for this level.`,
      });
      return;
    }

    // Create new session
    const newSession = await UserCheckpoint.createNewSession(userId, type, level, steps);
    await newSession.populate('shuffled_order');

    res.status(201).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} session created successfully`,
      data: {
        session: newSession,
        sessionStats: newSession.getSessionStats(),
        deckSize: newSession.shuffled_order.length,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create learning session',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Update current word index (move to next/previous word)
 */
export const updateWordIndex = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const { action, index } = req.body as {
      action: 'next' | 'previous' | 'jump';
      index?: number;
    };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No ${type} progress found`,
      });
      return;
    }

    let moved = false;
    switch (action) {
      case 'next':
        moved = progress.moveToNext();
        break;
      case 'previous':
        moved = progress.moveToPrevious();
        break;
      case 'jump':
        if (typeof index === 'number' && index >= 0 && index < progress.shuffled_order.length) {
          progress.current_index = index;
          moved = true;
        }
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "next", "previous", or "jump"',
        });
        return;
    }

    if (!moved) {
      res.status(400).json({
        success: false,
        message: `Cannot move ${action}. Check current position and deck bounds.`,
      });
      return;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: `Moved ${action} successfully`,
      data: {
        currentIndex: progress.current_index,
        currentWord: progress.getCurrentWord(),
        sessionStats: progress.getSessionStats(),
        isCompleted: progress.isCompleted(),
      },
    });
  } catch (error) {
    console.error('Update word index error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update word index',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Reset current session progress
 */
export const resetSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No ${type} progress found`,
      });
      return;
    }

    progress.resetProgress();
    await progress.save();

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} session reset successfully`,
      data: {
        currentIndex: progress.current_index,
        totalWords: progress.shuffled_order.length,
      },
    });
  } catch (error) {
    console.error('Reset session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset session',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Delete session entirely
 */
export const deleteSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    const result = await UserCheckpoint.deleteOne({
      user_id: userId,
      progress_type: type,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: `No ${type} progress found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} session deleted successfully`,
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Generate next sliding window when current deck is completed
 */
export const generateNextWindow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No ${type} progress found`,
      });
      return;
    }

    const canMove = await progress.canMoveToNextWindow(userId, type);
    if (!canMove) {
      res.status(400).json({
        success: false,
        message: 'Cannot move to next window. All words must be known or no more windows available.',
      });
      return;
    }

    await progress.generateNextSlidingWindow(userId, type);
    await progress.save();
    await progress.populate('shuffled_order');

    res.status(200).json({
      success: true,
      message: 'Next sliding window generated successfully',
      data: {
        newSteps: progress.steps,
        deckSize: progress.shuffled_order.length,
        sessionStats: progress.getSessionStats(),
      },
    });
  } catch (error) {
    console.error('Generate next window error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate next sliding window',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get all active sessions for user
 */
export const getAllSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const sessions = await UserCheckpoint.getActiveProgressForUser(userId);

    const sessionData = await Promise.all(
      sessions.map(async (session) => ({
        type: session.progress_type,
        level: session.current_level,
        steps: session.steps,
        sessionStats: session.getSessionStats(),
        isPassCompleted: session.isCompleted(),
        canMoveToNextWindow: await session.canMoveToNextWindow(userId, session.progress_type),
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        sessions: sessionData,
        totalSessions: sessions.length,
      },
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get learning statistics for user
 */
export const getLearningStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const stats: LearningStatsItem[] = await UserCheckpoint.getUserLearningStats(userId);

    // Get overall word progress statistics
    const wordStats = await Promise.all([
      WordProgress.getStudyStats(userId, 'main'),
      WordProgress.getStudyStats(userId, 'sub'),
    ]);

    const [mainWordStats, subWordStats] = wordStats;

    res.status(200).json({
      success: true,
      data: {
        sessionStats: stats,
        wordStats: {
          main: mainWordStats?.[0] || null,
          sub: subWordStats?.[0] || null,
        },
        overall: {
          totalSessions: stats.reduce((sum: number, s: LearningStatsItem) => sum + s.sessions, 0),
          totalWordsInDecks: stats.reduce((sum: number, s: LearningStatsItem) => sum + s.totalWords, 0),
          averageProgress:
            stats.reduce((sum: number, s: LearningStatsItem) => sum + s.avgProgress, 0) / Math.max(stats.length, 1),
        },
      },
    });
  } catch (error) {
    console.error('Get learning stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Switch between main and sub session types
 */
export const switchSessionType = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fromType, toType } = req.body as {
      fromType: ProgressType;
      toType: ProgressType;
    };
    const userId = req.user!._id;

    if (!['main', 'sub'].includes(fromType) || !['main', 'sub'].includes(toType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid session types. Must be "main" or "sub"',
      });
      return;
    }

    if (fromType === toType) {
      res.status(400).json({
        success: false,
        message: 'Cannot switch to the same session type',
      });
      return;
    }

    const fromSession = await UserCheckpoint.findByUserAndType(userId, fromType);
    const toSession = await UserCheckpoint.findByUserAndType(userId, toType);

    res.status(200).json({
      success: true,
      message: `Switched from ${fromType} to ${toType} session`,
      data: {
        fromSession: fromSession
          ? {
              type: fromSession.progress_type,
              level: fromSession.current_level,
              steps: fromSession.steps,
              sessionStats: fromSession.getSessionStats(),
              isCompleted: fromSession.isCompleted(),
            }
          : null,
        toSession: toSession
          ? {
              type: toSession.progress_type,
              level: toSession.current_level,
              steps: toSession.steps,
              sessionStats: toSession.getSessionStats(),
              isCompleted: toSession.isCompleted(),
              currentWord: toSession.getCurrentWord(),
            }
          : null,
        recommendation: !toSession
          ? `Create a new ${toType} session to start learning`
          : toSession.isCompleted()
          ? `${toType} session completed. Generate next window or create new session`
          : `Continue with ${toType} session`,
      },
    });
  } catch (error) {
    console.error('Switch session type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch session type',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Update checkpoint for current session
 */
export const updateCheckpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { progressCheckpoint } = req.body as {
      progressCheckpoint: {
        progress_type: ProgressType;
        level?: LearningLevel;
        steps?: StepRange;
        currentWordIndex?: number;
      };
    };

    if (!progressCheckpoint) {
      res.status(400).json({
        success: false,
        message: 'Progress checkpoint data is required',
      });
      return;
    }

    const progressType = progressCheckpoint.progress_type || 'main';

    // Find existing session
    const progress = await UserCheckpoint.findByUserAndType(userId, progressType);

    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No ${progressType} session found. Create a session first.`,
      });
      return;
    }

    // Update current index if provided
    if (typeof progressCheckpoint.currentWordIndex === 'number') {
      if (
        progressCheckpoint.currentWordIndex >= 0 &&
        progressCheckpoint.currentWordIndex < progress.shuffled_order.length
      ) {
        progress.current_index = progressCheckpoint.currentWordIndex;
      }
    }

    // Update level and steps if provided
    if (progressCheckpoint.level) {
      progress.current_level = progressCheckpoint.level;
    }
    if (progressCheckpoint.steps) {
      progress.steps = progressCheckpoint.steps;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Checkpoint updated successfully',
      data: {
        progress_type: progress.progress_type,
        current_level: progress.current_level,
        steps: progress.steps,
        current_index: progress.current_index,
        updated_at: progress.updated_at,
      },
    });
  } catch (error) {
    console.error('Update checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checkpoint',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  getUserProgress,
  createSession,
  updateWordIndex,
  resetSession,
  deleteSession,
  generateNextWindow,
  getAllSessions,
  getLearningStats,
  switchSessionType,
  updateCheckpoint,
};
