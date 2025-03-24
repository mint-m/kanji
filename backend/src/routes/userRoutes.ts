import { Router } from "express";
import * as userController from "../controllers/userControlloer";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = Router();

// 학습 체크포인트 업데이트
router.patch(
  "/checkpoint/:userId/:wordIndex",
  authenticateJwt,
  userController.updateCheckpoint
);

export default router;