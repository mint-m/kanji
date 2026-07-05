// src/routes/wordRoutes.ts
import { Router } from 'express';
import * as wordController from '../controllers/wordController';
import * as kanjiController from '../controllers/kanjiController';
import { handleValidationErrors } from '../middleware/validation';
import { param, query } from 'express-validator';
import { LEARNING_LEVELS } from '../types/common';

const router = Router();

// 레벨별 스텝 정보 가져오기
router.get(
  '/level/:level/steps',
  [
    param('level').isIn([...LEARNING_LEVELS]).withMessage('Level must be one of: N5, N4, N3, N2, N1, daily'),
    handleValidationErrors,
  ],
  wordController.getStepsForLevel
);

// 한자 검색 (네이버 API 활용)
router.get(
  '/kanjiSearch',
  [
    query('kanji')
      .isString().withMessage('kanji must be a single string, not an array')
      .trim()
      .notEmpty().withMessage('kanji query parameter is required')
      .isLength({ max: 10 }).withMessage('kanji must be 10 characters or fewer'),
    handleValidationErrors,
  ],
  kanjiController.searchKanji,
);

export default router;
