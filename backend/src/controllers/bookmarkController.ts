import { Response } from 'express';
import { PipelineStage } from 'mongoose';
import WordProgress from '../models/wordProgress';
import { AuthenticatedRequest } from '../middleware/auth';

export const BOOKMARK_LIMIT = 150;
const BOOKMARK_WARNING_THRESHOLD = 10;

/**
 * Toggle bookmark status for a word
 * @route POST /api/bookmarks/toggle
 */
export const toggleBookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wordId, reason, tags, progressType = 'main' } = req.body;
    const userId = req.user!._id;

    // 북마크는 세션 간 공유되므로, 다른 세션에 이미 북마크된 상태인지 먼저 확인해야
    // 해제/추가 여부를 올바르게 판단할 수 있음 (현재 세션 문서만 보면 반대로 동작할 수 있음)
    const isCurrentlyBookmarked = await WordProgress.exists({
      user_id: userId,
      word_id: wordId,
      is_bookmarked: true,
    });

    if (isCurrentlyBookmarked) {
      // 모든 세션에서 일괄 해제 — 세션별 문서가 따로 있어도 북마크 상태는 하나로 유지
      await WordProgress.updateMany(
        { user_id: userId, word_id: wordId, is_bookmarked: true },
        { $set: { is_bookmarked: false, bookmark_reason: undefined, bookmark_tags: [], bookmarked_at: undefined } }
      );

      res.json({
        success: true,
        data: { wordId, isBookmarked: false, bookmarkInfo: { isBookmarked: false, tags: [] } },
        message: 'Word unbookmarked successfully',
      });
      return;
    }

    // 새 북마크 추가 — 세션별 문서 수가 아닌 고유 단어 수 기준으로 한도 체크
    const bookmarkedWordIds = await WordProgress.distinct('word_id', { user_id: userId, is_bookmarked: true });
    const currentCount = bookmarkedWordIds.length;
    if (currentCount >= BOOKMARK_LIMIT) {
      res.status(409).json({
        success: false,
        code: 'BOOKMARK_LIMIT_EXCEEDED',
        message: `북마크 최대 개수(${BOOKMARK_LIMIT}개)에 도달했습니다. 기존 북마크를 정리해주세요.`,
      });
      return;
    }

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

    const remaining = BOOKMARK_LIMIT - (currentCount + 1);
    wordProgress.toggleBookmark(reason, tags);
    await wordProgress.save();

    res.json({
      success: true,
      data: { wordId, isBookmarked: true, bookmarkInfo: wordProgress.getBookmarkInfo() },
      message: 'Word bookmarked successfully',
      ...(remaining <= BOOKMARK_WARNING_THRESHOLD && { warning: { remaining } }),
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

export default {
  toggleBookmark,
  getBookmarks,
  updateBookmark,
};

