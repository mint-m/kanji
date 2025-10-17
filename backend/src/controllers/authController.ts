// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import config from '../config';
import User from '../models/user';
import { generateToken } from '../services/auth';
import { NotFoundError, UnauthorizedError, InternalServerError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = config;

// OAuth 클라이언트 초기화
const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

// Google 인증 요청 인터페이스
interface GoogleAuthCodeRequest {
  code: string;
  redirect_uri?: string;
}

// Google 로그인 요청 인터페이스
interface GoogleTokenLoginRequest {
  accessToken: string;
}

export const getGoogleAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as GoogleAuthCodeRequest;

    if (!code) {
      return next(new UnauthorizedError('Authorization code is required'));
    }

    const oAuth2ClientWithRedirect = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');

    const { tokens } = await oAuth2ClientWithRedirect.getToken({
      code: code,
    });

    if (!tokens.access_token) {
      return next(new UnauthorizedError('Failed to retrieve access token'));
    }

    res.json({
      success: true,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
    });
  } catch (error) {
    console.error('❌ Google OAuth Error:');
    console.error(error);
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

    // Use the new User model's findOrCreateFromOAuth method
    const user = await User.findOrCreateFromOAuth({
      type: 'google',
      email: userInfo.email,
      name: userInfo.name || userInfo.given_name || 'Google User',
    });

    // Check if user account is active
    if (!user.isActive) {
      return next(new UnauthorizedError('User account is deactivated'));
    }

    // JWT 토큰 생성
    const token = generateToken(user);

    // Return comprehensive user data including profile and preferences
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        profile: {
          displayName: user.getDisplayName(),
          profilePicture: user.profile.profilePicture,
          joinedAt: user.profile.joinedAt,
          studyLevel: user.getStudyLevel(),
        },
        preferences: user.preferences,
        statistics: user.statistics,
        isNewUser: user.isNewUser(),
        isVerified: user.emailVerified,
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
      .select('-__v') // Exclude version field only
      .lean();

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Calculate additional user info using instance methods (need to load as document)
    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
      return next(new NotFoundError('User document not found'));
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        profile: {
          displayName: userDoc.getDisplayName(),
          profilePicture: user.profile.profilePicture,
          bio: user.profile.bio,
          studyGoals: user.profile.studyGoals,
          joinedAt: user.profile.joinedAt,
          lastActiveAt: user.profile.lastActiveAt,
          timezone: user.profile.timezone,
          studyLevel: userDoc.getStudyLevel(),
          daysSinceJoined: userDoc.getDaysSinceJoined(),
        },
        preferences: user.preferences,
        statistics: user.statistics,
        authInfo: {
          lastActive: user.updatedAt,
          isVerified: user.emailVerified,
          accountType: user.type,
          isNewUser: userDoc.isNewUser(),
          canReceiveReminders: userDoc.canReceiveReminders(),
          hasLearningCheckpoint: userDoc.hasLearningCheckpoint(),
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
