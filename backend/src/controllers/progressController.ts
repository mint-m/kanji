import { Response } from 'express';
import UserCheckpoint from '../models/userCheckpoint';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProgressType } from '../types';

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

    const sessionData = sessions.map((session) => ({
      type: session.progress_type,
      level: session.current_level,
      steps: session.steps,
      sessionStats: session.getSessionStats(),
      isPassCompleted: session.isCompleted(),
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: { sessions: sessionData, totalSessions: sessions.length },
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve sessions' });
  }
};

export default {
  getUserProgress,
  deleteSession,
  getAllSessions,
};
