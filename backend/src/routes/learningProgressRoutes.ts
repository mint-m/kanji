import { Router } from "express";
import { authenticateJwt } from "../middleware/authMiddleware";
import * as learningProgressController from "../controllers/learningProgressController";

const router = Router();

// 학습 진행 상황 저장
router.post("/progress", authenticateJwt, learningProgressController.saveLearningProgress);

// 학습 진행 상황 조회
router.get("/progress", authenticateJwt, learningProgressController.getUserLearningProgress);

// 레벨별 학습 현황 요약 (향후 확장 가능)
router.get("/summary", authenticateJwt, learningProgressController.getLearningProgressSummary);

export default router;