import { Response } from 'express';
import { PipelineStage } from 'mongoose';
import WordProgress from '../models/wordProgress';
import { AuthenticatedRequest } from '../middleware/auth';
import { escapeRegex } from '../utils/regex';

const BOOKMARK_LIMIT = 150;
const BOOKMARK_WARNING_THRESHOLD = 10;

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
      wordProgress = new WordProgress({
        user_id: userId,
        word_id: wordId,
        progress_type: progressType,
      });
    }

    // Check limit only when adding a new bookmark
    if (!wordProgress.is_bookmarked) {
      const currentCount = await WordProgress.countDocuments({ user_id: userId, is_bookmarked: true });
      if (currentCount >= BOOKMARK_LIMIT) {
        res.status(409).json({
          success: false,
          code: 'BOOKMARK_LIMIT_EXCEEDED',
          message: `북마크 최대 개수(${BOOKMARK_LIMIT}개)에 도달했습니다. 기존 북마크를 정리해주세요.`,
        });
        return;
      }

      const remaining = BOOKMARK_LIMIT - (currentCount + 1);
      const isBookmarked = wordProgress.toggleBookmark(reason, tags);
      await wordProgress.save();

      res.json({
        success: true,
        data: { wordId, isBookmarked, bookmarkInfo: wordProgress.getBookmarkInfo() },
        message: 'Word bookmarked successfully',
        ...(remaining <= BOOKMARK_WARNING_THRESHOLD && { warning: { remaining } }),
      });
      return;
    }

    // Removing bookmark — no limit check needed
    const isBookmarked = wordProgress.toggleBookmark(reason, tags);
    await wordProgress.save();

    res.json({
      success: true,
      data: { wordId, isBookmarked, bookmarkInfo: wordProgress.getBookmarkInfo() },
      message: 'Word unbookmarked successfully',
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
      tags,
      level,
      page = 1,
      limit = 20,
      sortBy = 'last_studied_at',
      sortOrder = 'desc',
    } = req.query;

    // Build filter - progressType 필터 제거, 전체 북마크 조회
    const filter: any = {
      user_id: userId,
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
          from: 'word',
          localField: 'word_id',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
    ];

    // Add level filter if provided
    if (level) {
      pipeline.push({
        $match: { 'word.level': level },
      });
    }

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalCountResult = await WordProgress.aggregate(countPipeline);
    const totalCount = totalCountResult[0]?.total || 0;

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

    // Project only needed fields with unified field names
    pipeline.push({
      $project: {
        _id: 1,
        user_id: 1,
        word_id: 1,
        word: 1,
        notes: '$bookmark_reason',
        bookmarked_at: 1,
        is_bookmarked: 1,
        progress_type: 1,
      },
    });

    // Execute aggregation
    const bookmarks = await WordProgress.aggregate(pipeline);

    // 최적화된 응답: 페이지네이션 정보 포함
    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          currentPage: Number(page),
          itemsPerPage: Number(limit),
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
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
    const { reason, tags } = req.body;
    const userId = req.user!._id;

    const result = await WordProgress.updateMany(
      { user_id: userId, word_id: wordId, is_bookmarked: true },
      { $set: { bookmark_reason: reason, bookmark_tags: tags || [] } }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Bookmarked word not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { wordId, reason, tags: tags || [] },
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
        const bulkOps = wordIds.map((wordId: string) => ({
          updateOne: {
            filter: { user_id: userId, word_id: wordId, progress_type: progressType },
            update: {
              $setOnInsert: { user_id: userId, word_id: wordId, progress_type: progressType },
              $set: { is_bookmarked: true, bookmark_reason: reason, bookmark_tags: tags || [] },
            },
            upsert: true,
          },
        }));
        const bulkResult = await WordProgress.bulkWrite(bulkOps);
        modified = bulkResult.modifiedCount + bulkResult.upsertedCount;
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

    // progressType 파라미터 제거, 전체 북마크 통계 조회
    const stats = await WordProgress.getBookmarkAnalytics(userId);

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

    // Build search pipeline - progressType 필터 제거, 전체 북마크 검색
    const pipeline: PipelineStage[] = [
      {
        $match: {
          user_id: userId,
          is_bookmarked: true,
        },
      },
      {
        $lookup: {
          from: 'word',
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
      const safeSearch = escapeRegex(searchTerm);
      matchConditions.$or = [
        { 'word.entry': { $regex: safeSearch, $options: 'i' } },
        { 'word.pron': { $regex: safeSearch, $options: 'i' } },
        { 'word.means': { $regex: safeSearch, $options: 'i' } },
        { bookmark_reason: { $regex: safeSearch, $options: 'i' } },
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
      matchConditions.is_window_completed = isCompleted;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add success rate calculation only if sorting by success_rate
    if (sortBy === 'success_rate') {
      pipeline.push({
        $addFields: {
          successRate: {
            $cond: [{ $eq: ['$try_count', 0] }, 0, { $divide: ['$correct_count', '$try_count'] }],
          },
        },
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
        : sortBy === 'success_rate'
        ? 'successRate'
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

    // Project only needed fields with unified field names
    pipeline.push({
      $project: {
        _id: 1,
        user_id: 1,
        word_id: 1,
        word: 1,
        notes: '$bookmark_reason',
        bookmarked_at: 1,
        is_bookmarked: 1,
        progress_type: 1,
      },
    });

    // Execute search
    const results = await WordProgress.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        bookmarks: results,
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
