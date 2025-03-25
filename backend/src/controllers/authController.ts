// src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import config from "../config";
import User from "../models/user";
import { generateToken } from "../services/auth";
import { NotFoundError, UnauthorizedError, InternalServerError } from "../utils/errors";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
} = config;

// OAuth 클라이언트 초기화
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Google 인증 요청 인터페이스
interface GoogleAuthCodeRequest {
  code: string;
}

// Google 로그인 요청 인터페이스
interface GoogleTokenLoginRequest {
  accessToken: string;
}

// Google 액세스 토큰 발급
export const getGoogleAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.body as GoogleAuthCodeRequest;
    
    if (!code) {
      return next(new UnauthorizedError("Authorization code is required"));
    }
    
    const { tokens } = await oAuth2Client.getToken({
      code: code,
      redirect_uri: REDIRECT_URI
    });
    
    if (!tokens.access_token) {
      return next(new UnauthorizedError("Failed to retrieve access token"));
    }
    
    res.json({ accessToken: tokens.access_token });
  } catch (error) {
    next(new InternalServerError("Failed to get Google access token"));
  }
};

// Google 로그인 처리
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.body as GoogleTokenLoginRequest;
    
    if (!accessToken) {
      return next(new UnauthorizedError("Access token is required"));
    }
    
    const userInfo = await getUserInfoWithToken(accessToken);
    
    if (!userInfo.email) {
      return next(new UnauthorizedError("Failed to retrieve user email"));
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
            max: 2
          }
        },
      });
      user = await newUser.save();
    }

    // JWT 토큰 생성
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    next(new InternalServerError("Google login failed"));
  }
};

// Google 액세스 토큰으로 사용자 정보 조회
const getUserInfoWithToken = async (tokens: string) => {
  oAuth2Client.setCredentials({ access_token: tokens });
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
  });
  const userInfo = (await oauth2.userinfo.get()).data;

  return userInfo;
};

// 사용자 프로필 조회
export const getProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // authenticateJwt 미들웨어에서 설정한 userId 사용
    if (!req.user?.userId) {
      return next(new UnauthorizedError("User not authenticated"));
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return next(new NotFoundError("User not found"));
    }
    
    res.json(user);
  } catch (error) {
    next(new InternalServerError("Failed to fetch user profile"));
  }
};

// 로그아웃
export const logout = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // JWT 토큰 블랙리스트는 Redis나 다른 저장소를 사용하여 구현할 수 있습니다
    // 성공 응답만 반환 이후 특정 보안 필요 업데이트가 있을때 구현 예정
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    next(new InternalServerError("Logout failed"));
  }
};