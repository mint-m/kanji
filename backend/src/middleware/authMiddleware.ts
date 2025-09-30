// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../config';
import mongoose from 'mongoose';
import User from '../models/user';
import { UnauthorizedError } from '../utils/errors';

const { JWT_SECRET } = config;

// JWT 토큰 페이로드 인터페이스
export interface TokenPayload {
  userId: string;
  email: string;
  type: string;
  iat?: number;
  exp?: number;
}

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: mongoose.Types.ObjectId;
        email: string;
        name: string;
        type: string;
      };
    }
  }
}

// JWT 토큰 검증 미들웨어
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }

    // 토큰에서 따옴표 제거 (필요한 경우)
    const tokenString = authHeader.split(' ')[1].replace(/\"/gi, '');

    // 토큰 검증
    const decoded = jwt.verify(tokenString, JWT_SECRET as Secret) as TokenPayload;

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      type: user.type,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

// 선택적 인증 미들웨어 - 토큰이 있으면 검증하지만, 없어도 진행
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const tokenString = authHeader.split(' ')[1].replace(/\"/gi, '');
    const decoded = jwt.verify(tokenString, JWT_SECRET as Secret) as TokenPayload;
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = {
        _id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
      };
    }

    next();
  } catch (error) {
    // 인증 실패해도 다음 미들웨어로 진행
    next();
  }
};
