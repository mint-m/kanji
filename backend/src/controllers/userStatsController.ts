// src/controllers/userStatsController.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
import UserProgress from '../models/userProgress';
import WordProgress from '../models/wordProgress';
import { NotFoundError, ForbiddenError, InternalServerError } from '../utils/errors';

// Get learning stats for a user
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Check if user is authorized to view stats
    if (req.user?._id.toString() !== userId) {
      return next(new ForbiddenError('You can only view your own statistics'));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get active UserProgress sessions (main and sub)
    const mainProgress = await UserProgress.findByUserAndType(userObjectId, 'main');
    const subProgress = await UserProgress.findByUserAndType(userObjectId, 'sub');

    // Get Word model for total word count
    const Word = mongoose.model('Word');

    // Calculate overall learning progress (all levels combined)
    const totalWordsInDatabase = await Word.countDocuments();
    const totalCompletedWords = await WordProgress.countDocuments({
      user_id: userObjectId,
      is_completed: true,
    });
    const overallProgressPercentage = totalWordsInDatabase > 0
      ? Math.round((totalCompletedWords / totalWordsInDatabase) * 100)
      : 0;

    // Format response
    const response: any = {
      overall: {
        totalWords: totalWordsInDatabase,
        completedWords: totalCompletedWords,
        progressPercentage: overallProgressPercentage,
      },
      sessions: [],
    };

    // Add main session info if exists
    if (mainProgress) {
      const sessionStats = mainProgress.getSessionStats();
      response.sessions.push({
        type: 'main',
        currentLevel: mainProgress.current_level,
        steps: mainProgress.steps,
        cycleProgress: {
          current: sessionStats.completedWords,
          total: sessionStats.totalWords,
          percentage: Math.round(sessionStats.progressPercentage),
        },
      });
    }

    // Add sub session info if exists
    if (subProgress) {
      const sessionStats = subProgress.getSessionStats();
      response.sessions.push({
        type: 'sub',
        currentLevel: subProgress.current_level,
        steps: subProgress.steps,
        cycleProgress: {
          current: sessionStats.completedWords,
          total: sessionStats.totalWords,
          percentage: Math.round(sessionStats.progressPercentage),
        },
      });
    }

    // Return stats
    res.json(response);
  } catch (error) {
    console.error('Get user stats error:', error);
    next(new InternalServerError('Failed to get user statistics'));
  }
};
