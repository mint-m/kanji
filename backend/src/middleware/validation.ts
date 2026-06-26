import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

// Helper function to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Progress type validation
const progressTypeValidator = param('type').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"');

// Action validation for word index updates
const actionValidator = body('action')
  .isIn(['next', 'previous', 'jump'])
  .withMessage('Action must be "next", "previous", or "jump"');

// Index validation for jump action
const indexValidator = body('index').optional().isInt({ min: 0 }).withMessage('Index must be a non-negative integer');

// Progress request validation groups
export const validateProgressRequest = {
  // GET /api/progress/:type
  getProgress: [progressTypeValidator, handleValidationErrors],

  // PUT /api/progress/:type/index
  updateIndex: [
    progressTypeValidator,
    actionValidator,
    indexValidator,
    body().custom((_value, { req }) => {
      if (req.body.action === 'jump' && (req.body.index === undefined || req.body.index === null)) {
        throw new Error('Index is required when action is "jump"');
      }
      return true;
    }),
    handleValidationErrors,
  ],

};

// User authentication validation
export const validateUserRequest = {
  // Registration/Login
  userAuth: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Name must be between 1 and 100 characters'),
    handleValidationErrors,
  ],

  // Update user preferences
  updatePreferences: [
    body('studyReminders').optional().isBoolean().withMessage('Study reminders must be boolean'),
    body('reminderTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Reminder time must be in HH:MM format'),
    body('dailyGoal').optional().isInt({ min: 1, max: 100 }).withMessage('Daily goal must be between 1 and 100'),
    body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Theme must be "light", "dark", or "auto"'),
    body('language').optional().isIn(['ko', 'en', 'ja']).withMessage('Language must be "ko", "en", or "ja"'),
    body('soundEffects').optional().isBoolean().withMessage('Sound effects must be boolean'),
    body('autoPlayAudio').optional().isBoolean().withMessage('Auto play audio must be boolean'),
    handleValidationErrors,
  ],

  // Update user profile
  updateProfile: [
    body('displayName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage('Display name must be between 1 and 50 characters'),
    body('bio').optional().isLength({ max: 500 }).trim().withMessage('Bio must be less than 500 characters'),
    body('studyGoals').optional().isArray().withMessage('Study goals must be an array'),
    body('studyGoals.*')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Each study goal must be between 1 and 100 characters'),
    body('timezone')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Timezone must be between 1 and 50 characters'),
    handleValidationErrors,
  ],
};

// Word progress validation
export const validateWordProgressRequest = {
  // Record study attempt
  recordAttempt: [
    body('wordId').isMongoId().withMessage('Valid word ID is required'),
    body('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('isCorrect').isBoolean().withMessage('Is correct must be boolean'),
    body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
    handleValidationErrors,
  ],

  // Toggle bookmark
  toggleBookmark: [
    body('wordId').isMongoId().withMessage('Valid word ID is required'),
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
    handleValidationErrors,
  ],

  // Bulk operations
  bulkOperation: [
    body('wordIds').isArray({ min: 1 }).withMessage('Word IDs array is required and must not be empty'),
    body('wordIds.*').isMongoId().withMessage('Each word ID must be valid'),
    body('action')
      .isIn(['mark_completed', 'mark_incomplete', 'bookmark', 'unbookmark', 'reset_progress'])
      .withMessage('Invalid bulk action'),
    body('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    handleValidationErrors,
  ],
};

// Word search validation
export const validateWordRequest = {
  // Search words
  searchWords: [
    body('level')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
      .withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    body('step').optional().isInt({ min: 1 }).withMessage('Step must be a positive integer'),
    body('stepRange.start').optional().isInt({ min: 1 }).withMessage('Step range start must be a positive integer'),
    body('stepRange.end').optional().isInt({ min: 1 }).withMessage('Step range end must be a positive integer'),
    body('searchTerm')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Search term must be between 1 and 100 characters'),
    body('partsOfSpeech').optional().isArray().withMessage('Parts of speech must be an array'),
    body('hasKanji').optional().isBoolean().withMessage('Has kanji must be boolean'),
    body('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    handleValidationErrors,
  ],

  // Get random words
  getRandomWords: [
    body('level')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
      .withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
    body('stepRange.start').optional().isInt({ min: 1 }).withMessage('Step range start must be a positive integer'),
    body('stepRange.end').optional().isInt({ min: 1 }).withMessage('Step range end must be a positive integer'),
    handleValidationErrors,
  ],
};

// Generic MongoDB ID validation
export const validateMongoId = (field: string) => [
  param(field).isMongoId().withMessage(`${field} must be a valid MongoDB ObjectId`),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  body('sortBy').optional().isString().withMessage('Sort by must be a string'),
  body('sortOrder').optional().isIn(['asc', 'desc', 1, -1]).withMessage('Sort order must be "asc", "desc", 1, or -1'),
  handleValidationErrors,
];

// Deck validation
export const validateDeckRequest = {
  // GET /api/progress/:progressType/current|deck-stats
  progressType: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    handleValidationErrors,
  ],

  // POST /api/progress/:progressType/complete-word
  completeWord: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('wordId').isMongoId().withMessage('Valid word ID is required'),
    body('isCorrect').isBoolean().withMessage('Is correct must be boolean'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
    handleValidationErrors,
  ],

  // POST /api/progress/:progressType/bulk-complete
  bulkCompleteWords: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('completions').isArray({ min: 1, max: 100 }).withMessage('Completions must be array with 1-100 items'),
    body('completions.*.wordId').isMongoId().withMessage('Each completion must have valid word ID'),
    body('completions.*.isCorrect').isBoolean().withMessage('Each completion must have isCorrect boolean'),
    body('completions.*.timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
    handleValidationErrors,
  ],

  // POST /api/progress/:progressType/complete-deck
  completeDeck: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    handleValidationErrors,
  ],
};

export default {
  validateProgressRequest,
  validateUserRequest,
  validateWordProgressRequest,
  validateWordRequest,
  validateDeckRequest,
  validateMongoId,
  validatePagination,
  handleValidationErrors,
};
