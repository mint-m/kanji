// src/controllers/wordController.ts
import { Request, Response, NextFunction } from 'express';
import Word from '../models/word';
import { NotFoundError, InternalServerError } from '../utils/errors';

// 모든 단어 가져오기
export const getAllWords = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const words = await Word.find();
    res.json(words);
  } catch (error) {
    next(new InternalServerError('Failed to fetch words'));
  }
};

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

    const totalWords = await Word.countDocuments({ level: level });
    const availableSteps = stepStats.map((stat) => stat._id).sort((a, b) => a - b);
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

// Get words by level and step
export const getWordsByLevelAndStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, step } = req.params;
    const { limit = 50, page = 1, sortBy = 'entry', sortOrder = 'asc' } = req.query;

    const filter: any = { level: level };

    if (step) {
      filter.step = parseInt(step as string);
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const words = await Word.find(filter).sort(sort).skip(skip).limit(Number(limit));

    const totalCount = await Word.countDocuments(filter);

    if (words.length === 0) {
      return next(new NotFoundError(`No words found for level ${level}${step ? ` step ${step}` : ''}`));
    }

    res.json({
      success: true,
      data: {
        words,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit),
        },
        filter: { level, step: step ? parseInt(step as string) : undefined },
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch words by level and step'));
  }
};

// Get words by step range
export const getWordsByStepRange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, startStep, endStep } = req.params;
    const { limit = 50, page = 1, sortBy = 'step', sortOrder = 'asc' } = req.query;

    // Handle both URL params and query params for flexibility
    const start = parseInt((startStep || req.query.startStep) as string);
    const end = parseInt((endStep || req.query.endStep) as string);

    if (!start || !end) {
      return next(new NotFoundError('Both startStep and endStep are required'));
    }

    if (start > end) {
      return next(new NotFoundError('startStep must be less than or equal to endStep'));
    }

    let filter: any = {
      step: { $gte: start, $lte: end },
    };

    // Add level filter if provided (from params or query)
    const levelParam = level || req.query.level;
    if (levelParam) {
      filter.level = levelParam;
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const words = await Word.find(filter).sort(sort).skip(skip).limit(Number(limit));

    const totalCount = await Word.countDocuments(filter);

    if (words.length === 0) {
      return next(new NotFoundError(`No words found for level ${level} steps ${start}-${end}`));
    }

    // Group words by step for better organization
    const wordsByStep = words.reduce((acc, word) => {
      const step = word.step;
      if (!acc[step]) {
        acc[step] = [];
      }
      acc[step].push(word);
      return acc;
    }, {} as Record<number, any[]>);

    res.json({
      success: true,
      data: {
        words,
        wordsByStep,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit),
        },
        filter: {
          level,
          stepRange: { start, end },
        },
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to fetch words by step range'));
  }
};

// Advanced word search with step filtering
export const searchWords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      searchTerm,
      level,
      step,
      stepRange,
      partsOfSpeech,
      hasKanji,
      limit = 50,
      page = 1,
      sortBy = 'entry',
      sortOrder = 'asc',
    } = req.body;

    // Build search filter
    const filter: any = {};

    if (level) {
      filter.level = level;
    }

    if (step) {
      filter.step = step;
    } else if (stepRange) {
      filter.step = {
        $gte: stepRange.start,
        $lte: stepRange.end,
      };
    }

    if (searchTerm) {
      filter.$or = [
        { entry: { $regex: searchTerm, $options: 'i' } },
        { pron: { $regex: searchTerm, $options: 'i' } },
        { means: { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
      ];
    }

    if (partsOfSpeech && partsOfSpeech.length > 0) {
      filter.parts = { $in: partsOfSpeech };
    }

    if (typeof hasKanji === 'boolean') {
      if (hasKanji) {
        filter.pron = { $nin: [null, ''] };
      } else {
        filter.$or = [{ pron: null }, { pron: '' }];
      }
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const words = await Word.find(filter).sort(sort).skip(skip).limit(Number(limit));

    const totalCount = await Word.countDocuments(filter);

    res.json({
      success: true,
      data: {
        words,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit),
        },
        searchCriteria: {
          searchTerm,
          level,
          step,
          stepRange,
          partsOfSpeech,
          hasKanji,
        },
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to search words'));
  }
};

// Get random words with step filtering
export const getRandomWords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, step, stepRange, count = 10, excludeCompleted = false, prioritizeBookmarked = false } = req.body;

    // Build match filter
    const matchFilter: any = {};

    if (level) {
      matchFilter.level = level;
    }

    if (step) {
      matchFilter.step = step;
    } else if (stepRange) {
      matchFilter.step = {
        $gte: stepRange.start,
        $lte: stepRange.end,
      };
    }

    // Build aggregation pipeline
    const pipeline: any[] = [{ $match: matchFilter }];

    // Add random sampling
    pipeline.push({ $sample: { size: Number(count) * 2 } }); // Get more than needed for filtering

    // Execute aggregation
    let words = await Word.aggregate(pipeline);

    // Limit to requested count
    words = words.slice(0, Number(count));

    if (words.length === 0) {
      return next(new NotFoundError('No words found matching the criteria'));
    }

    res.json({
      success: true,
      data: {
        words,
        count: words.length,
        criteria: {
          level,
          step,
          stepRange,
          excludeCompleted,
          prioritizeBookmarked,
        },
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to get random words'));
  }
};

// Get word statistics by level and step
export const getWordStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level } = req.params;

    const stats = await Word.aggregate([
      { $match: level ? { level } : {} },
      {
        $group: {
          _id: {
            level: '$level',
            step: '$step',
          },
          wordCount: { $sum: 1 },
          hasKanjiCount: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$pron', null] }, { $ne: ['$pron', ''] }] }, 1, 0],
            },
          },
          partsOfSpeech: { $addToSet: '$parts' },
        },
      },
      {
        $group: {
          _id: '$_id.level',
          totalWords: { $sum: '$wordCount' },
          totalWithKanji: { $sum: '$hasKanjiCount' },
          stepBreakdown: {
            $push: {
              step: '$_id.step',
              wordCount: '$wordCount',
              hasKanjiCount: '$hasKanjiCount',
            },
          },
          allPartsOfSpeech: { $addToSet: '$partsOfSpeech' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get overall statistics if no level specified
    const overallStats = await Word.aggregate([
      {
        $group: {
          _id: null,
          totalWords: { $sum: 1 },
          totalWithKanji: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$pron', null] }, { $ne: ['$pron', ''] }] }, 1, 0],
            },
          },
          levelBreakdown: {
            $push: {
              level: '$level',
              step: '$step',
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        levelStatistics: stats,
        overallStatistics: overallStats[0] || {},
        requestedLevel: level || 'all',
      },
    });
  } catch (error) {
    next(new InternalServerError('Failed to get word statistics'));
  }
};

