import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateUser, authRateLimit, securityHeaders } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Apply security headers to all auth routes
router.use(securityHeaders);

// Google OAuth 인증 관련 라우트
router.post(
  '/google/access-token',
  [
    authRateLimit(10, 15 * 60 * 1000),
    body('code').notEmpty().withMessage('Authorization code is required'),
    // redirect_uri 검증 제거 (백엔드 config 값 사용)
    handleValidationErrors,
  ],
  authController.getGoogleAccessToken
);

router.post(
  '/google/login',
  [
    authRateLimit(5, 15 * 60 * 1000),
    body('accessToken').notEmpty().isLength({ min: 10 }).withMessage('Valid access token is required'),
    handleValidationErrors,
  ],
  authController.googleLogin
);

// Google One Tap (ID token credential)
router.post(
  '/google/one-tap',
  [
    authRateLimit(10, 15 * 60 * 1000),
    body('credential').notEmpty().withMessage('Credential is required'),
    handleValidationErrors,
  ],
  authController.googleOneTap
);

// 카카오 로그인 (authorization code)
router.post(
  '/kakao/callback',
  [
    authRateLimit(10, 15 * 60 * 1000),
    body('code').notEmpty().withMessage('Authorization code is required'),
    body('redirectUri').notEmpty().withMessage('redirectUri is required'),
    handleValidationErrors,
  ],
  authController.kakaoCallback
);

// 계정 연동 (로그인된 사용자)
router.post(
  '/link/google',
  [
    authenticateUser,
    authRateLimit(10, 15 * 60 * 1000),
    body('accessToken').notEmpty().withMessage('Access token is required'),
    handleValidationErrors,
  ],
  authController.linkGoogle,
);

router.post(
  '/link/kakao',
  [
    authenticateUser,
    authRateLimit(10, 15 * 60 * 1000),
    body('code').notEmpty().withMessage('Authorization code is required'),
    body('redirectUri').notEmpty().withMessage('redirectUri is required'),
    handleValidationErrors,
  ],
  authController.linkKakao,
);

// 토큰 검증
router.get('/verify', authenticateUser, authController.verifyToken);

// 토큰 새로고침
router.post('/refresh', authenticateUser, authController.refreshToken);

// 사용자 프로필 조회
router.get('/profile', authenticateUser, authController.getProfile);

// 로그아웃
router.post('/logout', authenticateUser, authController.logout);

export default router;
