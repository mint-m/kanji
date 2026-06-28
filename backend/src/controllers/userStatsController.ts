// src/controllers/userStatsController.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import Word from '../models/word';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import { LEARNING_LEVELS } from '../types/common';
import { NotFoundError, InternalServerError } from '../utils/errors';

// Get learning stats for a user
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateJwt 미들웨어에서 이미 검증됨
    const userId = req.user!._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    const [mainProgress, subProgress] = await Promise.all([
      UserCheckpoint.findByUserAndType(userId, 'main'),
      UserCheckpoint.findByUserAndType(userId, 'sub'),
    ]);

    // 전체 단어 수 + 레벨별 단어 수를 한 번의 aggregation으로 조회
    const wordCountByLevel: { _id: string; count: number }[] = await Word.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]);

    const totalWordsInDatabase = wordCountByLevel.reduce((sum, l) => sum + l.count, 0);

    // 완료된 단어 수를 레벨별로 한 번의 aggregation으로 조회
    const completedByLevel: { _id: string; count: number }[] = await WordProgress.aggregate([
      { $match: { user_id: userId, is_window_completed: true } },
      {
        $lookup: {
          from: 'words',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      { $group: { _id: '$word.level', count: { $sum: 1 } } },
    ]);

    const totalCompletedWords = completedByLevel.reduce((sum, l) => sum + l.count, 0);
    const overallProgressPercentage =
      totalWordsInDatabase > 0 ? Math.round((totalCompletedWords / totalWordsInDatabase) * 100) : 0;

    const levelBreakdown = LEARNING_LEVELS.map((level) => {
      const total = wordCountByLevel.find((l) => l._id === level)?.count ?? 0;
      const completed = completedByLevel.find((l) => l._id === level)?.count ?? 0;
      return { level, total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    });

    const response: {
      overall: { totalWords: number; completedWords: number; progressPercentage: number };
      streak: { current: number; longest: number; studyDays: number };
      totalWordsStudied: number;
      levelBreakdown: { level: string; total: number; completed: number; percentage: number }[];
      sessions: { type: string; currentLevel: string; steps: object; cycleProgress: object }[];
    } = {
      overall: {
        totalWords: totalWordsInDatabase,
        completedWords: totalCompletedWords,
        progressPercentage: overallProgressPercentage,
      },
      streak: {
        current: user.statistics.currentStreak,
        longest: user.statistics.longestStreak,
        studyDays: user.statistics.studyDaysCount,
      },
      totalWordsStudied: user.statistics.totalWordsStudied,
      levelBreakdown,
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
