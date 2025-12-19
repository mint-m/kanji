import { Router } from 'express';
import bookmarkController from '../controllers/bookmarkController';
import { authenticateUser } from '../middleware/auth';
import { validateWordProgressRequest, validatePagination } from '../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();

// All bookmark routes require authentication
router.use(authenticateUser);

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
 * @desc    Get all bookmarked words for authenticated user with pagination and filtering
 * @access  Private
 * @query   {
 *            progressType?: 'main'|'sub',
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
    query('progressType').optional().isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    query('level')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
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
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['last_studied_at', 'kanji', 'level', 'step', 'bookmark_reason'])
      .withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"'),
  ],
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
  bookmarkController.updateBookmark
);

/**
 * @route   POST /api/bookmarks/bulk
 * @desc    Perform bulk bookmark operations (bookmark/unbookmark multiple words)
 * @access  Private
 * @body    {
 *            wordIds: string[],
 *            action: 'bookmark'|'unbookmark',
 *            progressType?: 'main'|'sub',
 *            reason?: string,
 *            tags?: string[]
 *          }
 */
router.post(
  '/bulk',
  [
    body('wordIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('Word IDs array is required and must contain 1-100 items'),
    body('wordIds.*').isMongoId().withMessage('Each word ID must be valid'),
    body('action').isIn(['bookmark', 'unbookmark']).withMessage('Action must be "bookmark" or "unbookmark"'),
    body('progressType').optional().isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
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
  ],
  bookmarkController.bulkBookmarkOperation
);

/**
 * @route   GET /api/bookmarks/stats
 * @desc    Get comprehensive bookmark statistics and analytics
 * @access  Private
 * @query   {
 *            progressType?: 'main'|'sub'
 *          }
 */
router.get(
  '/stats',
  [query('progressType').optional().isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"')],
  bookmarkController.getBookmarkStats
);

/**
 * @route   POST /api/bookmarks/search
 * @desc    Advanced search for bookmarked words with multiple filter options
 * @access  Private
 * @body    {
 *            progressType?: 'main'|'sub',
 *            searchTerm?: string,
 *            level?: 'N5'|'N4'|'N3'|'N2'|'N1',
 *            step?: number,
 *            tags?: string[],
 *            isCompleted?: boolean,
 *            sortBy?: string,
 *            sortOrder?: 'asc'|'desc',
 *            page?: number,
 *            limit?: number
 *          }
 */
router.post(
  '/search',
  [
    body('progressType').optional().isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('searchTerm')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Search term must be between 1 and 100 characters'),
    body('level')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
      .withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    body('step').optional().isInt({ min: 1 }).withMessage('Step must be a positive integer'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage('Each tag must be between 1 and 50 characters'),
    body('isCompleted').optional().isBoolean().withMessage('Is completed must be boolean'),
    body('sortBy')
      .optional()
      .isIn(['last_studied_at', 'kanji', 'level', 'step', 'success_rate', 'bookmark_reason'])
      .withMessage('Invalid sort field'),
    body('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"'),
    body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  bookmarkController.searchBookmarks
);

export default router;
