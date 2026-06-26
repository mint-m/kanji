import { Response } from 'express';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProgressType, LearningLevel } from '../types';

interface LearningStatsItem {
  _id: ProgressType;
  sessions: number;
  totalWords: number;
  completedWords: number;
  levels: LearningLevel[];
  avgProgress: number;
}

export const getUserProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    if (!['main', 'sub'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid progress type. Must be "main" or "sub"' });
      return;
    }

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({ success: false, message: `No ${type} progress found. Create a new session first.` });
      return;
    }

    await progress.populate('shuffled_order');

    res.status(200).json({
      success: true,
      data: {
        progress,
        sessionStats: progress.getSessionStats(),
        currentWord: progress.getCurrentWord(),
        remainingWords: progress.getRemainingWords().length,
        canMoveToNextWindow: await progress.canMoveToNextWindow(userId, type),
      },
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user progress' });
  }
};

export const updateWordIndex = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const { action, index } = req.body as { action: 'next' | 'previous' | 'jump'; index?: number };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({ success: false, message: `No ${type} progress found` });
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
        res.status(400).json({ success: false, message: 'Invalid action. Must be "next", "previous", or "jump"' });
        return;
    }

    if (!moved) {
      res.status(400).json({ success: false, message: `Cannot move ${action}. Check current position and deck bounds.` });
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
    res.status(500).json({ success: false, message: 'Failed to update word index' });
  }
};

export const resetSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, type);
    if (!progress) {
      res.status(404).json({ success: false, message: `No ${type} progress found` });
      return;
    }

    progress.resetProgress();
    await progress.save();

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} session reset successfully`,
      data: { currentIndex: progress.current_index, totalWords: progress.shuffled_order.length },
    });
  } catch (error) {
    console.error('Reset session error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset session' });
  }
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params as { type: ProgressType };
    const userId = req.user!._id;

    const result = await UserCheckpoint.deleteOne({ user_id: userId, progress_type: type });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: `No ${type} progress found` });
      return;
    }

    res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} session deleted successfully`,
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
};

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
      data: { sessions: sessionData, totalSessions: sessions.length },
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve sessions' });
  }
};

export const getLearningStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const stats: LearningStatsItem[] = await UserCheckpoint.getUserLearningStats(userId);

    const [mainWordStats, subWordStats] = await Promise.all([
      WordProgress.getStudyStats(userId, 'main'),
      WordProgress.getStudyStats(userId, 'sub'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        sessionStats: stats,
        wordStats: { main: mainWordStats?.[0] || null, sub: subWordStats?.[0] || null },
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
    res.status(500).json({ success: false, message: 'Failed to retrieve learning statistics' });
  }
};

export default {
  getUserProgress,
  updateWordIndex,
  resetSession,
  deleteSession,
  getAllSessions,
  getLearningStats,
};
