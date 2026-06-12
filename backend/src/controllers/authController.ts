import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import config from '../config';
import User from '../models/user';
import { UserDocument } from '../interfaces/user';
import { generateToken } from '../services/auth';
import { getKakaoAccessToken, getKakaoUserInfo } from '../services/kakao';
import { NotFoundError, UnauthorizedError, InternalServerError, ConflictError, AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';
import { GoogleAuthCodeRequest, GoogleTokenLoginRequest } from '../types/api/requests';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = config;

const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

const buildLoginResponse = (user: UserDocument) => ({
  _id: user._id,
  email: user.email,
  name: user.name,
  type: user.type,
  activeProgressType: user.activeProgressType,
  authProviders: user.authProviders.map((p) => p.provider),
  profile: {
    displayName: user.getDisplayName(),
    profilePicture: user.profile.profilePicture,
    joinedAt: user.profile.joinedAt,
  },
  preferences: user.preferences,
  statistics: user.statistics,
  isNewUser: user.isNewUser(),
});

const sendLoginResponse = (user: UserDocument, res: Response, next: NextFunction) => {
  if (!user.isActive) return next(new UnauthorizedError('User account is deactivated'));
  res.json({ success: true, token: generateToken(user), user: buildLoginResponse(user) });
};

const getGoogleUserInfo = async (accessToken: string) => {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  return (await oauth2.userinfo.get()).data;
};

export const getGoogleAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as GoogleAuthCodeRequest;

    if (!code) {
      return next(new UnauthorizedError('Authorization code is required'));
    }

    const oAuth2ClientWithRedirect = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');
    const { tokens } = await oAuth2ClientWithRedirect.getToken(code);

    if (!tokens.access_token) {
      return next(new UnauthorizedError('Failed to retrieve access token'));
    }

    res.json({ success: true, accessToken: tokens.access_token, idToken: tokens.id_token });
  } catch (error) {
    console.error('Google OAuth error:', error);
    next(new InternalServerError('Failed to get Google access token'));
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body as GoogleTokenLoginRequest;

    if (!accessToken) {
      return next(new UnauthorizedError('Access token is required'));
    }

    const userInfo = await getGoogleUserInfo(accessToken);

    if (!userInfo.email || !userInfo.id) {
      return next(new UnauthorizedError('Failed to retrieve user info'));
    }

    const user = await User.findOrCreateFromOAuth({
      type: 'google',
      providerId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || userInfo.given_name || 'Google User',
    });

    return sendLoginResponse(user, res, next);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    console.error('Google login error:', error);
    next(new InternalServerError('Google login failed'));
  }
};

export const googleOneTap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body as { credential: string };

    if (!credential) {
      return next(new UnauthorizedError('Credential is required'));
    }

    const ticket = await oAuth2Client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return next(new UnauthorizedError('Failed to retrieve user email from credential'));
    }

    const user = await User.findOrCreateFromOAuth({
      type: 'google',
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
    });

    return sendLoginResponse(user, res, next);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    console.error('Google One Tap error:', error);
    next(new InternalServerError('Google One Tap login failed'));
  }
};

export const kakaoCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, redirectUri } = req.body as { code: string; redirectUri: string };

    if (!code || !redirectUri) {
      return next(new UnauthorizedError('Authorization code and redirectUri are required'));
    }

    const accessToken = await getKakaoAccessToken(code, redirectUri);
    const { kakaoId, email, name } = await getKakaoUserInfo(accessToken);

    const user = await User.findOrCreateFromOAuth({ type: 'kakao', providerId: kakaoId, email, name });

    return sendLoginResponse(user, res, next);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    console.error('Kakao login error:', error);
    next(new InternalServerError('Kakao login failed'));
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const user = await User.findById(req.user._id).select('-__v');

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        authProviders: user.authProviders.map((p) => p.provider),
        profile: {
          displayName: user.getDisplayName(),
          profilePicture: user.profile.profilePicture,
          bio: user.profile.bio,
          studyGoals: user.profile.studyGoals,
          joinedAt: user.profile.joinedAt,
          lastActiveAt: user.profile.lastActiveAt,
          timezone: user.profile.timezone,
          studyLevel: user.getStudyLevel(),
          daysSinceJoined: user.getDaysSinceJoined(),
        },
        preferences: user.preferences,
        statistics: user.statistics,
        authInfo: {
          lastActive: user.updatedAt,
          isVerified: user.emailVerified,
          accountType: user.type,
          isNewUser: user.isNewUser(),
          canReceiveReminders: user.canReceiveReminders(),
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(new InternalServerError('Failed to fetch user profile'));
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?._id) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.updateLastActive();
        await user.save();
      }
    }

    res.json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    next(new InternalServerError('Logout failed'));
  }
};

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return next(new UnauthorizedError('Invalid token'));
    }

    const user = await User.findById(req.user._id)
      .select('_id email name type isActive emailVerified updatedAt')
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

export const refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return next(new UnauthorizedError('Invalid token for refresh'));
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('Cannot refresh token for inactive user'));
    }

    user.updateLastActive();
    await user.save();

    res.json({ success: true, token: generateToken(user) });
  } catch (error) {
    console.error('Token refresh error:', error);
    next(new InternalServerError('Token refresh failed'));
  }
};

// 구글 계정 연동
export const linkGoogle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) return next(new UnauthorizedError('User not authenticated'));
    const { accessToken } = req.body as { accessToken: string };
    if (!accessToken) return next(new UnauthorizedError('Access token is required'));

    const userInfo = await getGoogleUserInfo(accessToken);
    if (!userInfo.email || !userInfo.id) return next(new UnauthorizedError('Failed to retrieve Google user info'));

    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('User not found'));

    if (user.authProviders.some((p) => p.provider === 'google')) {
      return next(new ConflictError('Google account is already linked to this user'));
    }

    const providerId = userInfo.id!;
    const existing = await User.findOne({ 'authProviders.provider': 'google', 'authProviders.providerId': providerId });
    if (existing && String(existing._id) !== String(req.user._id)) {
      return next(new ConflictError('This Google account is already linked to another user'));
    }
    if (!existing) {
      user.authProviders.push({ provider: 'google', providerId });
      await user.save();
    }

    res.json({ success: true, authProviders: user.authProviders.map((p) => p.provider) });
  } catch (error) {
    console.error('Link Google error:', error);
    next(new InternalServerError('Failed to link Google account'));
  }
};

// 카카오 계정 연동
export const linkKakao = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) return next(new UnauthorizedError('User not authenticated'));
    const { code, redirectUri } = req.body as { code: string; redirectUri: string };
    if (!code || !redirectUri) return next(new UnauthorizedError('code and redirectUri are required'));

    const accessToken = await getKakaoAccessToken(code, redirectUri);
    const { kakaoId } = await getKakaoUserInfo(accessToken);

    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('User not found'));

    if (user.authProviders.some((p) => p.provider === 'kakao')) {
      return next(new ConflictError('Kakao account is already linked to this user'));
    }

    const existing = await User.findOne({ 'authProviders.provider': 'kakao', 'authProviders.providerId': kakaoId });
    if (existing && String(existing._id) !== String(req.user._id)) {
      return next(new ConflictError('This Kakao account is already linked to another user'));
    }
    if (!existing) {
      user.authProviders.push({ provider: 'kakao', providerId: kakaoId });
      await user.save();
    }

    res.json({ success: true, authProviders: user.authProviders.map((p) => p.provider) });
  } catch (error) {
    console.error('Link Kakao error:', error);
    next(new InternalServerError('Failed to link Kakao account'));
  }
};
