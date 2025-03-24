import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = Router();

// Google OAuth 인증 관련 라우트
router.post("/google/access-token", authController.getGoogleAccessToken);
router.post("/google-login", authController.googleLogin);

// 사용자 프로필 조회
router.get("/profile", authenticateJwt, authController.getProfile);

// 로그아웃
router.post("/logout", authenticateJwt, authController.logout);

export default router;