import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as userStatsController from '../controllers/userStatsController';
import { authenticateJwt } from '../middleware/authMiddleware';
import progressRoutes from './progressRoutes';
import bookmarkRoutes from './bookmarkRoutes';

const router = Router();

// ========================================
// /api/users/me/* - 현재 로그인한 사용자
// ========================================

// 내 프로필 조회
router.get('/me', authenticateJwt, userController.getUserProfile);

// 내 활성 세션 타입 업데이트
router.patch('/me/active-progress-type', authenticateJwt, userController.updateActiveProgressType);

// 내 학습 체크포인트 업데이트
router.patch('/me/checkpoint', authenticateJwt, userController.updateCheckpoint);

// 내 학습 통계 조회
router.get('/me/stats', authenticateJwt, userStatsController.getUserStats);

// 내 진행 상황 관리 - /api/users/me/progress/*
router.use('/me/progress', authenticateJwt, progressRoutes);

// 내 북마크 관리 - /api/users/me/bookmarks/*
router.use('/me/bookmarks', authenticateJwt, bookmarkRoutes);

// ========================================
// /api/users/:userId/* - 관리자용 (미래 확장)
// ========================================

// TODO: 관리자 권한 체크 미들웨어 추가 필요
// router.get('/:userId', authenticateJwt, requireRole(['admin']), userController.getUserProfile);

export default router;
