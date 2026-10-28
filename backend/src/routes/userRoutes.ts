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

// 내 닉네임 변경
router.patch('/me', authenticateUser, userController.updateUserName);

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

export default router;
