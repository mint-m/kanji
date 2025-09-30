// src/controllers/userStatsController.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
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

    // Get models
    const LearningProgress = mongoose.model('LearningProgress');
    const Word = mongoose.model('Word');

    // Get total word counts per level from the database
    const levelWordCounts = await Word.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]);

    // Create a map of level to word count
    const levelTotals: Record<string, number> = {};
    levelWordCounts.forEach((item) => {
      levelTotals[item._id] = item.count;
    });

    // Aggregate mastered words by level
    const wordsByLevel = await LearningProgress.aggregate([
      { $match: { userId, status: 'mastered' } },
      // Group by wordId to count unique words (not repeated practices)
      { $group: { _id: { wordId: '$wordId', level: '$level' } } },
      // Group by level to get count per level
      { $group: { _id: '$_id.level', count: { $sum: 1 } } },
      { $project: { level: '$_id', mastered: '$count', _id: 0 } },
    ]);

    // Build level stats with percentages
    const levelStats = wordsByLevel.map((levelStat) => {
      const total = levelTotals[levelStat.level] || 0;
      return {
        level: levelStat.level,
        mastered: levelStat.mastered,
        total: total,
        percentage: total > 0 ? Math.round((levelStat.mastered / total) * 100) : 0,
      };
    });

    // Add levels with 0 mastery but that exist in the database
    Object.keys(levelTotals).forEach((level) => {
      const exists = levelStats.some((stat) => stat.level === level);
      if (!exists && levelTotals[level] > 0) {
        levelStats.push({
          level,
          mastered: 0,
          total: levelTotals[level],
          percentage: 0,
        });
      }
    });

    // Sort by level (N5 to N1)
    levelStats.sort((a, b) => {
      const levelA = parseInt(a.level.replace(/\D/g, ''));
      const levelB = parseInt(b.level.replace(/\D/g, ''));
      return levelA - levelB;
    });

    // Return stats
    res.json(levelStats);
  } catch (error) {
    next(new InternalServerError('Failed to get user statistics'));
  }
};
