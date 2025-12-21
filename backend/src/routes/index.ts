import { Router } from 'express';
import wordRoutes from './wordRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

// 인증 관련 엔드포인트 - /api/auth/*
router.use('/api/auth', authRoutes);

// 단어 데이터 관련 엔드포인트 - /api/words/*
router.use('/api/words', wordRoutes);

// 사용자 관련 엔드포인트 - /api/users/*
// /api/users/me/* - 내 정보, 진행상황, 북마크 등
router.use('/api/users', userRoutes);

export default router;
