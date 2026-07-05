import { Router } from 'express';
import bookmarkController from '../controllers/bookmarkController';
import { validateWordProgressRequest, handleValidationErrors } from '../middleware/validation';
import { body, query, param } from 'express-validator';
import { LEARNING_LEVELS } from '../types/common';

const router = Router();

// Authentication is applied in parent router (userRoutes.ts)
// No need to apply authenticateUser here again

/**
 * @route   POST /api/bookmarks/toggle
 * @desc    Toggle bookmark status for a word (bookmark/unbookmark)
 * @access  Private
 * @body    {
 *            wordId: string,
 *            reason?: string,
 *            tags?: string[],
 *            progressType?: 'main'|'sub'
 *          }
 */
router.post('/toggle', validateWordProgressRequest.toggleBookmark, bookmarkController.toggleBookmark);

/**
 * @route   GET /api/bookmarks
 * @desc    Get all bookmarked words for authenticated user with pagination (전체 북마크 조회)
 * @access  Private
 * @query   {
 *            tags?: string|string[],
 *            level?: 'N5'|'N4'|'N3'|'N2'|'N1',
 *            page?: number,
 *            limit?: number,
 *            sortBy?: string,
 *            sortOrder?: 'asc'|'desc'
 *          }
 */
router.get(
  '/',
  [
    query('level')
      .optional()
      .isIn([...LEARNING_LEVELS])
      .withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    query('tags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          return true;
        }
        throw new Error('Tags must be string or array of strings');
      }),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['last_studied_at', 'kanji', 'level', 'step', 'bookmark_reason'])
      .withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"'),
  ],
  handleValidationErrors,
  bookmarkController.getBookmarks
);

/**
 * @route   PUT /api/bookmarks/:wordId
 * @desc    Update bookmark details (reason and tags)
 * @access  Private
 * @param   {string} wordId - MongoDB ObjectId of the word
 * @body    {
 *            reason?: string,
 *            tags?: string[],
 *            progressType?: 'main'|'sub'
 *          }
 */
router.put(
  '/:wordId',
  [
    param('wordId').isMongoId().withMessage('Valid word ID is required'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .trim()
      .withMessage('Bookmark reason must be less than 200 characters'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('progressType').optional().isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
  ],
  handleValidationErrors,
  bookmarkController.updateBookmark
);

export default router;
