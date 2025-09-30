import { Request, Response } from 'express';
import mongoose, { PipelineStage } from 'mongoose';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import { ProgressType } from '../interfaces/userProgress';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Toggle bookmark status for a word
 * @route POST /api/bookmarks/toggle
 */
export const toggleBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wordId, reason, tags, progressType = 'main' } = req.body;
    const userId = req.user!._id;

    // Find or create word progress
    let wordProgress = await WordProgress.findOne({
      user_id: userId,
      word_id: wordId,
      progress_type: progressType,
    });

    if (!wordProgress) {
      // Create new word progress if it doesn't exist
      wordProgress = new WordProgress({
        user_id: userId,
        word_id: wordId,
        progress_type: progressType,
      });
    }

    // Toggle bookmark using the model method
    const isBookmarked = wordProgress.toggleBookmark(reason, tags);
    await wordProgress.save();

    // Get word details for response
    const word = await Word.findById(wordId);

    res.json({
      success: true,
      data: {
        wordId,
        isBookmarked,
        bookmarkInfo: wordProgress.getBookmarkInfo(),
        word: word
          ? {
              kanji: word.entry,
              readings: word.pron,
              meanings: word.means,
            }
          : null,
      },
      message: isBookmarked ? 'Word bookmarked successfully' : 'Word unbookmarked successfully',
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
    });
  }
};

/**
 * Get all bookmarked words for a user
 * @route GET /api/bookmarks
 */
export const getBookmarks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      progressType = 'main',
      tags,
      level,
      page = 1,
      limit = 50,
      sortBy = 'last_studied_at',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter: any = {
      user_id: userId,
      progress_type: progressType,
      is_bookmarked: true,
    };

    // Add tag filter if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.bookmark_tags = { $in: tagArray };
    }

    // Build aggregation pipeline
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'words',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      {
        $addFields: {
          'word.bookmarkInfo': {
            isBookmarked: '$is_bookmarked',
            reason: '$bookmark_reason',
            tags: '$bookmark_tags',
            bookmarkedAt: '$last_studied_at',
          },
          'word.progressInfo': {
            isCompleted: '$is_completed',
            tryCount: '$try_count',
            correctCount: '$correct_count',
            successRate: {
              $cond: [{ $eq: ['$try_count', 0] }, 0, { $divide: ['$correct_count', '$try_count'] }],
            },
            lastStudiedAt: '$last_studied_at',
            timeSpentTotal: '$time_spent_total',
          },
        },
      },
    ];

    // Add level filter if provided
    if (level) {
      pipeline.push({
        $match: { 'word.level': level },
      });
    }

    // Add sorting
    const sortField =
      sortBy === 'level'
        ? 'word.level'
        : sortBy === 'step'
        ? 'word.step'
        : sortBy === 'kanji'
        ? 'word.kanji'
        : `${sortBy}`;

    pipeline.push({
      $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
    });

    // Add pagination
    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    // Execute aggregation
    const bookmarks = await WordProgress.aggregate(pipeline);

    // Get total count for pagination
    const totalCountPipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'words',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
    ];

    if (level) {
      totalCountPipeline.push({
        $match: { 'word.level': level },
      });
    }

    totalCountPipeline.push({ $count: 'total' });
    const totalCountResult = await WordProgress.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.total || 0;

    // Get bookmark statistics
    const statsResult = await WordProgress.aggregate([
      {
        $match: {
          user_id: userId,
          progress_type: progressType,
          is_bookmarked: true,
        },
      },
      {
        $lookup: {
          from: 'words',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      {
        $group: {
          _id: null,
          totalBookmarks: { $sum: 1 },
          byLevel: {
            $push: {
              level: '$word.level',
              step: '$word.step',
            },
          },
          completedBookmarks: {
            $sum: { $cond: ['$is_completed', 1, 0] },
          },
          allTags: { $push: '$bookmark_tags' },
        },
      },
      {
        $addFields: {
          levelDistribution: {
            $reduce: {
              input: '$byLevel',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.level',
                          v: {
                            $add: [{ $ifNull: [{ $getField: { field: '$$this.level', input: '$$value' } }, 0] }, 1],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
          uniqueTags: {
            $reduce: {
              input: '$allTags',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] },
            },
          },
        },
      },
    ]);

    const stats = statsResult[0] || {
      totalBookmarks: 0,
      completedBookmarks: 0,
      levelDistribution: {},
      uniqueTags: [],
    };

    res.json({
      success: true,
      data: {
        bookmarks: bookmarks.map((b) => b.word),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit),
        },
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmarks',
    });
  }
};

/**
 * Update bookmark details (reason and tags)
 * @route PUT /api/bookmarks/:wordId
 */
export const updateBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wordId } = req.params;
    const { reason, tags, progressType = 'main' } = req.body;
    const userId = req.user!._id;

    const wordProgress = await WordProgress.findOne({
      user_id: userId,
      word_id: wordId,
      progress_type: progressType,
      is_bookmarked: true,
    });

    if (!wordProgress) {
      res.status(404).json({
        success: false,
        message: 'Bookmarked word not found',
      });
      return;
    }

    // Update bookmark details
    wordProgress.bookmark_reason = reason;
    wordProgress.bookmark_tags = tags || [];
    await wordProgress.save();

    res.json({
      success: true,
      data: {
        wordId,
        bookmarkInfo: wordProgress.getBookmarkInfo(),
      },
      message: 'Bookmark updated successfully',
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bookmark',
    });
  }
};

/**
 * Bulk bookmark operations
 * @route POST /api/bookmarks/bulk
 */
export const bulkBookmarkOperation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wordIds, action, progressType = 'main', reason, tags } = req.body;
    const userId = req.user!._id;

    let modified = 0;

    switch (action) {
      case 'bookmark':
        // Create or update word progress documents to set bookmarks
        for (const wordId of wordIds) {
          const wordProgress = await WordProgress.findOneAndUpdate(
            {
              user_id: userId,
              word_id: wordId,
              progress_type: progressType,
            },
            {
              $setOnInsert: {
                user_id: userId,
                word_id: wordId,
                progress_type: progressType,
              },
              $set: {
                is_bookmarked: true,
                bookmark_reason: reason,
                bookmark_tags: tags || [],
              },
            },
            { upsert: true, new: true }
          );
          if (wordProgress) modified++;
        }
        break;

      case 'unbookmark':
        const unbookmarkResult = await WordProgress.updateMany(
          {
            user_id: userId,
            word_id: { $in: wordIds },
            progress_type: progressType,
          },
          {
            $set: {
              is_bookmarked: false,
              bookmark_reason: undefined,
              bookmark_tags: [],
            },
          }
        );
        modified = unbookmarkResult.modifiedCount;
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid bulk action',
        });
        return;
    }

    res.json({
      success: true,
      data: {
        modifiedCount: modified,
        action,
      },
      message: `Bulk ${action} operation completed successfully`,
    });
  } catch (error) {
    console.error('Bulk bookmark operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk bookmark operation',
    });
  }
};

/**
 * Get bookmark statistics and analytics
 * @route GET /api/bookmarks/stats
 */
export const getBookmarkStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { progressType = 'main' } = req.query;

    const stats = await WordProgress.getBookmarkAnalytics(userId, progressType as ProgressType);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get bookmark stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmark statistics',
    });
  }
};

/**
 * Search bookmarks with advanced filters
 * @route POST /api/bookmarks/search
 */
export const searchBookmarks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      progressType = 'main',
      searchTerm,
      level,
      step,
      tags,
      isCompleted,
      sortBy = 'last_studied_at',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = req.body;

    // Build search pipeline
    const pipeline: PipelineStage[] = [
      {
        $match: {
          user_id: userId,
          progress_type: progressType,
          is_bookmarked: true,
        },
      },
      {
        $lookup: {
          from: 'words',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
    ];

    // Add search filters
    const matchConditions: any = {};

    if (searchTerm) {
      matchConditions.$or = [
        { 'word.kanji': { $regex: searchTerm, $options: 'i' } },
        { 'word.readings.hiragana': { $regex: searchTerm, $options: 'i' } },
        { 'word.readings.katakana': { $regex: searchTerm, $options: 'i' } },
        { 'word.readings.romaji': { $regex: searchTerm, $options: 'i' } },
        { 'word.meanings.en': { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { 'word.meanings.ko': { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { bookmark_reason: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (level) {
      matchConditions['word.level'] = level;
    }

    if (step) {
      matchConditions['word.step'] = step;
    }

    if (tags && tags.length > 0) {
      matchConditions.bookmark_tags = { $in: tags };
    }

    if (typeof isCompleted === 'boolean') {
      matchConditions.is_completed = isCompleted;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add enhanced word data
    pipeline.push({
      $addFields: {
        'word.bookmarkInfo': {
          isBookmarked: '$is_bookmarked',
          reason: '$bookmark_reason',
          tags: '$bookmark_tags',
          bookmarkedAt: '$last_studied_at',
        },
        'word.progressInfo': {
          isCompleted: '$is_completed',
          tryCount: '$try_count',
          correctCount: '$correct_count',
          successRate: {
            $cond: [{ $eq: ['$try_count', 0] }, 0, { $divide: ['$correct_count', '$try_count'] }],
          },
          lastStudiedAt: '$last_studied_at',
          timeSpentTotal: '$time_spent_total',
        },
      },
    });

    // Add sorting
    const sortField =
      sortBy === 'level'
        ? 'word.level'
        : sortBy === 'step'
        ? 'word.step'
        : sortBy === 'kanji'
        ? 'word.kanji'
        : sortBy === 'success_rate'
        ? 'word.progressInfo.successRate'
        : `${sortBy}`;

    pipeline.push({
      $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
    });

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalCountResult = await WordProgress.aggregate(countPipeline);
    const totalCount = totalCountResult[0]?.total || 0;

    // Add pagination
    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skip }, { $limit: Number(limit) });

    // Execute search
    const results = await WordProgress.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        bookmarks: results.map((r) => r.word),
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
          tags,
          isCompleted,
          progressType,
        },
      },
    });
  } catch (error) {
    console.error('Search bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search bookmarks',
    });
  }
};

export default {
  toggleBookmark,
  getBookmarks,
  updateBookmark,
  bulkBookmarkOperation,
  getBookmarkStats,
  searchBookmarks,
};
