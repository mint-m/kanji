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

// Learning level validation
const learningLevelValidator = body('level')
  .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
  .withMessage('Level must be one of: N5, N4, N3, N2, N1');

// Step range validation
const stepRangeValidator = [
  body('steps.start').isInt({ min: 1 }).withMessage('Step start must be a positive integer'),
  body('steps.end').isInt({ min: 1 }).withMessage('Step end must be a positive integer'),
  body('steps').custom((value) => {
    if (value.start > value.end) {
      throw new Error('Step start must be less than or equal to step end');
    }
    return true;
  }),
];

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

  // POST /api/progress
  createSession: [
    body('type').isIn(['main', 'sub']).withMessage('Type must be "main" or "sub"'),
    learningLevelValidator,
    ...stepRangeValidator,
    handleValidationErrors,
  ],

  // PUT /api/progress/:type/index
  updateIndex: [
    progressTypeValidator,
    actionValidator,
    indexValidator,
    body().custom((value, { req }) => {
      if (req.body.action === 'jump' && (req.body.index === undefined || req.body.index === null)) {
        throw new Error('Index is required when action is "jump"');
      }
      return true;
    }),
    handleValidationErrors,
  ],

  // POST /api/progress/switch
  switchSession: [
    body('fromType').isIn(['main', 'sub']).withMessage('From type must be "main" or "sub"'),
    body('toType').isIn(['main', 'sub']).withMessage('To type must be "main" or "sub"'),
    body().custom((value, { req }) => {
      if (req.body.fromType === req.body.toType) {
        throw new Error('From type and to type must be different');
      }
      return true;
    }),
    handleValidationErrors,
  ],

  // POST /api/progress/updateCheckpoint
  updateCheckpoint: [
    body('progressCheckpoint').exists().withMessage('Progress checkpoint data is required'),
    body('progressCheckpoint.progress_type').exists().withMessage('progress_type is required').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('progressCheckpoint.level')
      .optional()
      .isIn(['N5', 'N4', 'N3', 'N2', 'N1'])
      .withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    body('progressCheckpoint.steps.start')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Step start must be a positive integer'),
    body('progressCheckpoint.steps.end')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Step end must be a positive integer'),
    body('progressCheckpoint.currentWordIndex')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Current word index must be non-negative integer'),
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
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
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
    body('stepRange.start')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Step range start must be a positive integer'),
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
    body('stepRange.start')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Step range start must be a positive integer'),
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
  // POST /api/progress/generate
  generateDeck: [
    body('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    body('steps.start').isInt({ min: 1 }).withMessage('Step start must be a positive integer'),
    body('steps.end').isInt({ min: 1 }).withMessage('Step end must be a positive integer'),
    body('steps').custom((value) => {
      if (value.start > value.end) {
        throw new Error('Step start must be less than or equal to step end');
      }
      return true;
    }),
    body('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('options.excludeCompleted').optional().isBoolean().withMessage('Exclude completed must be boolean'),
    body('options.prioritizeBookmarked').optional().isBoolean().withMessage('Prioritize bookmarked must be boolean'),
    body('options.shuffleOrder').optional().isBoolean().withMessage('Shuffle order must be boolean'),
    body('options.maxWords')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Max words must be between 1 and 1000'),
    handleValidationErrors,
  ],

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
    body('autoGenerateNext').optional().isBoolean().withMessage('Auto generate next must be boolean'),
    body('sessionFeedback.enjoyment')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Enjoyment must be integer between 1 and 5'),
    body('sessionFeedback.notes')
      .optional()
      .isLength({ max: 500 })
      .trim()
      .withMessage('Notes must be less than 500 characters'),
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
