import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as userStatsController from '../controllers/userStatsController';
import { authenticateUser } from '../middleware/auth';
import progressRoutes from './progressRoutes';
import bookmarkRoutes from './bookmarkRoutes';

const router = Router();

// ========================================
// /api/users/me/* - 현재 로그인한 사용자
// ========================================

// 내 프로필 조회
router.get('/me', authenticateUser, userController.getUserProfile);

// 내 활성 세션 타입 업데이트
router.patch('/me/active-progress-type', authenticateUser, userController.updateActiveProgressType);

// 내 학습 체크포인트 업데이트
router.patch('/me/checkpoint', authenticateUser, userController.updateCheckpoint);

// 내 학습 통계 조회
router.get('/me/stats', authenticateUser, userStatsController.getUserStats);

// 내 진행 상황 관리 - /api/users/me/progress/*
router.use('/me/progress', authenticateUser, progressRoutes);

// 내 북마크 관리 - /api/users/me/bookmarks/*
router.use('/me/bookmarks', authenticateUser, bookmarkRoutes);

// ========================================
// /api/users/:userId/* - 관리자용 (미래 확장)
// ========================================

// TODO: 관리자 권한 체크 미들웨어 추가 필요
// router.get('/:userId', authenticateUser, requireRole(['admin']), userController.getUserProfile);

export default router;
