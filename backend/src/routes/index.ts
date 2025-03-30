import { Router } from "express";
import wordRoutes from "./wordRoutes";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import learningProgressRoutes from "./learningProgressRoutes";

const router = Router();

// 인증 관련 엔드포인트 - /auth/...
router.use("/auth", authRoutes);

// 단어 데이터 관련 엔드포인트 - /api/words/...
router.use("/api/words", wordRoutes);

// 사용자 정보 관련 엔드포인트 - /api/users/...
router.use("/api/users", userRoutes);

// 학습 진행 상황 관련 엔드포인트 - /api/learning/...
router.use("/api/learning", learningProgressRoutes);

export default router;