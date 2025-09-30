// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import config from '../config';
import User from '../models/user';
import { generateToken } from '../services/auth';
import { NotFoundError, UnauthorizedError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI } = config;

// OAuth 클라이언트 초기화
const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

// Google 인증 요청 인터페이스
interface GoogleAuthCodeRequest {
  code: string;
}

// Google 로그인 요청 인터페이스
interface GoogleTokenLoginRequest {
  accessToken: string;
}

// Google 액세스 토큰 발급
export const getGoogleAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as GoogleAuthCodeRequest;

    if (!code) {
      return next(new UnauthorizedError('Authorization code is required'));
    }

    const { tokens } = await oAuth2Client.getToken({
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    if (!tokens.access_token) {
      return next(new UnauthorizedError('Failed to retrieve access token'));
    }

    res.json({ accessToken: tokens.access_token });
  } catch (error) {
    next(new InternalServerError('Failed to get Google access token'));
  }
};

// Google 로그인 처리
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body as GoogleTokenLoginRequest;

    if (!accessToken) {
      return next(new UnauthorizedError('Access token is required'));
    }

    const userInfo = await getUserInfoWithToken(accessToken);

    if (!userInfo.email) {
      return next(new UnauthorizedError('Failed to retrieve user email'));
    }

    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      // 새 사용자 생성
      const newUser = new User({
        email: userInfo.email,
        name: userInfo.name || userInfo.given_name,
        type: 'google',
        learningCheckpoint: {
          level: 5,
          step: {
            min: 1,
            max: 2,
          },
        },
        emailVerified: true, // Google accounts are pre-verified
        isActive: true,
      });
      user = await newUser.save();
    } else {
      // Update last active time for existing users
      user.updateLastActive();
      await user.save();
    }

    // Check if user account is active
    if (!user.isActive) {
      return next(new UnauthorizedError('User account is deactivated'));
    }

    // JWT 토큰 생성
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        isNewUser: !user.createdAt || Date.now() - user.createdAt.getTime() < 60000, // Less than 1 minute old
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    next(new InternalServerError('Google login failed'));
  }
};

// Google 액세스 토큰으로 사용자 정보 조회
const getUserInfoWithToken = async (tokens: string) => {
  oAuth2Client.setCredentials({ access_token: tokens });
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: 'v2',
  });
  const userInfo = (await oauth2.userinfo.get()).data;

  return userInfo;
};

// 사용자 프로필 조회
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Enhanced auth middleware sets req.user with _id
    if (!req.user?._id) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const user = await User.findById(req.user._id)
      .select('-password -__v') // Exclude sensitive fields
      .populate('statistics.streakHistory', 'date wordsStudied')
      .lean();

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    res.json({
      success: true,
      data: {
        user,
        authInfo: {
          lastActive: user.updatedAt,
          isVerified: user.emailVerified,
          accountType: user.type,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(new InternalServerError('Failed to fetch user profile'));
  }
};

// 로그아웃
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Update user's last active time on logout
    if (req.user?._id) {
      try {
        const user = await User.findById(req.user._id);
        if (user) {
          user.updateLastActive();
          await user.save();
        }
      } catch (updateError) {
        console.error('Failed to update last active on logout:', updateError);
        // Don't fail logout if this fails
      }
    }

    // JWT 토큰 블랙리스트는 Redis나 다른 저장소를 사용하여 구현할 수 있습니다
    // 현재는 클라이언트 측에서 토큰을 삭제하도록 안내
    res.json({
      success: true,
      message: 'Successfully logged out',
      instructions: 'Please remove the token from client storage',
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(new InternalServerError('Logout failed'));
  }
};

// 토큰 검증 및 새로고침
export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // This endpoint is reached after auth middleware, so user is already verified
    if (!req.user?._id) {
      return next(new UnauthorizedError('Invalid token'));
    }

    const user = await User.findById(req.user._id)
      .select('_id email name type isActive emailVerified lastActiveAt')
      .lean();

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('User account is inactive'));
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          type: user.type,
          isVerified: user.emailVerified,
          lastActive: user.updatedAt,
        },
        tokenValid: true,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    next(new InternalServerError('Token verification failed'));
  }
};

// 토큰 새로고침
export const refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return next(new UnauthorizedError('Invalid token for refresh'));
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('Cannot refresh token for inactive user'));
    }

    // Generate new token
    const newToken = generateToken(user);

    // Update last active time
    user.updateLastActive();
    await user.save();

    res.json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    next(new InternalServerError('Token refresh failed'));
  }
};
