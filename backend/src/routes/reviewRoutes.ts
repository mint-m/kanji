import { Router } from 'express';
import { body, query } from 'express-validator';
import reviewController from '../controllers/reviewController';
import { handleValidationErrors } from '../middleware/validation';

// 인증은 상위 라우터(userRoutes)에서 적용된다
const router = Router();

router.get(
  '/due',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  reviewController.getDueReviews
);

router.post(
  '/answer',
  [
    body('wordId').isMongoId().withMessage('Valid word ID is required'),
    body('isCorrect').isBoolean().withMessage('Is correct must be boolean'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative integer'),
    handleValidationErrors,
  ],
  reviewController.answerReview
);

export default router;
