import { Router } from "express";
import wordRoutes from "./wordRoutes";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import learningProgressRoutes from "./learningProgressRoutes";
import progressRoutes from "./progressRoutes";
import deckRoutes from "./deckRoutes";
import bookmarkRoutes from "./bookmarkRoutes";

const router = Router();

// 인증 관련 엔드포인트 - /auth/...
router.use("/auth", authRoutes);

// 단어 데이터 관련 엔드포인트 - /api/words/...
router.use("/api/words", wordRoutes);

// 사용자 정보 관련 엔드포인트 - /api/users/...
router.use("/api/users", userRoutes);

// 학습 진행 상황 관련 엔드포인트 - /api/learning/...
router.use("/api/learning", learningProgressRoutes);

// 사용자 진행 상황 관리 엔드포인트 - /api/progress/...
router.use("/api/progress", progressRoutes);

// 덱 생성 및 완료 처리 엔드포인트 - /api/deck/...
router.use("/api/deck", deckRoutes);

// 북마크 관리 엔드포인트 - /api/bookmarks/...
router.use("/api/bookmarks", bookmarkRoutes);

export default router;