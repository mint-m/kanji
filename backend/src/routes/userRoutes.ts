import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as userStatsController from '../controllers/userStatsController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

// 사용자 프로필 가져오기
router.get('/:userId', authenticateJwt, userController.getUserProfile);

// 활성 세션 타입 업데이트
router.patch('/:userId/active-progress-type', authenticateJwt, userController.updateActiveProgressType);

// 학습 체크포인트 업데이트
router.patch('/:userId/checkpoint', authenticateJwt, userController.updateCheckpoint);

// 사용자 학습 통계 가져오기
router.get('/:userId/stats', authenticateJwt, userStatsController.getUserStats);

export default router;
