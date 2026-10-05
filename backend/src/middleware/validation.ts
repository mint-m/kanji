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

// Progress request validation groups
export const validateProgressRequest = {
  // GET|DELETE /api/users/me/progress/:type
  getProgress: [progressTypeValidator, handleValidationErrors],
};

// Word progress validation
export const validateWordProgressRequest = {
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
};

// Deck validation
export const validateDeckRequest = {
  // GET /api/users/me/progress/:progressType/current
  progressType: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    handleValidationErrors,
  ],

  // POST /api/users/me/progress/:progressType/complete-word
  completeWord: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    body('wordId').isMongoId().withMessage('Valid word ID is required'),
    body('isCorrect').isBoolean().withMessage('Is correct must be boolean'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
    body('index').optional().isInt({ min: 0 }).withMessage('Index must be non-negative integer'),
    handleValidationErrors,
  ],

  // POST /api/users/me/progress/:progressType/complete-deck
  completeDeck: [
    param('progressType').isIn(['main', 'sub']).withMessage('Progress type must be "main" or "sub"'),
    handleValidationErrors,
  ],
};

export default {
  validateProgressRequest,
  validateWordProgressRequest,
  validateDeckRequest,
  handleValidationErrors,
};
