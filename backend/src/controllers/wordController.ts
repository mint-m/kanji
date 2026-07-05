// src/controllers/wordController.ts
import { Request, Response, NextFunction } from 'express';
import Word from '../models/word';
import { InternalServerError } from '../utils/errors';

export const getStepsForLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const level = req.params.level;

    // Get step distribution for this level using the new step field
    const stepStats = await Word.aggregate([
      { $match: { level: level } },
      {
        $group: {
          _id: '$step',
          wordCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalWords = stepStats.reduce((sum, stat) => sum + stat.wordCount, 0);
    const availableSteps = stepStats.map((stat) => stat._id);
    const minStep = availableSteps.length > 0 ? Math.min(...availableSteps) : 1;
    const maxStep = availableSteps.length > 0 ? Math.max(...availableSteps) : 10;

    res.json({
      level,
      totalWords,
      totalSteps: availableSteps.length,
      stepRange: { min: minStep, max: maxStep },
      stepDistribution: stepStats,
      availableSteps,
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch steps for level'));
  }
};
