// src/routes/wordRoutes.ts
import { Router } from 'express';
import * as wordController from '../controllers/wordController';
import { validateWordRequest, handleValidationErrors } from '../middleware/validation';
import { param, query } from 'express-validator';

const router = Router();

// 모든 단어 가져오기
router.get('/all', wordController.getAllWords);

// 레벨별 단어 가져오기
router.get(
  '/level/:level',
  [
    param('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    handleValidationErrors,
  ],
  wordController.getWordsByLevel
);

// 레벨별 스텝 정보 가져오기
router.get(
  '/level/:level/steps',
  [
    param('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    handleValidationErrors,
  ],
  wordController.getStepsForLevel
);

// 레벨과 스텝별 단어 가져오기
router.get(
  '/level/:level/step/:step',
  [
    param('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    param('step').isInt({ min: 1, max: 10 }).withMessage('Step must be between 1 and 10'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('sortBy').optional().isIn(['kanji', 'step', 'level', 'readings.hiragana']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"'),
    handleValidationErrors,
  ],
  wordController.getWordsByLevelAndStep
);

// 레벨별 스텝 범위로 단어 가져오기
router.get(
  '/level/:level/steps/:startStep-:endStep',
  [
    param('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    param('startStep').isInt({ min: 1, max: 10 }).withMessage('Start step must be between 1 and 10'),
    param('endStep').isInt({ min: 1, max: 10 }).withMessage('End step must be between 1 and 10'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('sortBy').optional().isIn(['kanji', 'step', 'level', 'readings.hiragana']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be "asc" or "desc"'),
    query('includeSlidingWindow').optional().isBoolean().withMessage('Include sliding window must be boolean'),
    handleValidationErrors,
  ],
  wordController.getWordsByStepRange
);

// 스텝 범위로 단어 가져오기 (레벨 파라미터를 쿼리로)
router.get(
  '/step-range',
  [
    query('startStep').isInt({ min: 1, max: 10 }).withMessage('Start step must be between 1 and 10'),
    query('endStep').isInt({ min: 1, max: 10 }).withMessage('End step must be between 1 and 10'),
    query('level').optional().isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('includeSlidingWindow').optional().isBoolean().withMessage('Include sliding window must be boolean'),
    handleValidationErrors,
  ],
  wordController.getWordsByStepRange
);

// 고급 단어 검색
router.post('/search', validateWordRequest.searchWords, wordController.searchWords);

// 랜덤 단어 가져오기
router.post('/random', validateWordRequest.getRandomWords, wordController.getRandomWords);

// 단어 통계 가져오기
router.get('/statistics', wordController.getWordStatistics);

// 레벨별 단어 통계 가져오기
router.get(
  '/statistics/:level',
  [
    param('level').isIn(['N5', 'N4', 'N3', 'N2', 'N1']).withMessage('Level must be one of: N5, N4, N3, N2, N1'),
    handleValidationErrors,
  ],
  wordController.getWordStatistics
);

// 한자 검색 (네이버 API 활용)
router.get('/kanjiSearch', wordController.searchKanji);

export default router;
