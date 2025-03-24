// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import config from "../config";
import { UnauthorizedError } from "../utils/errors";

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
        userId: string;
      };
    }
  }
}

// JWT 토큰 검증 미들웨어
export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is required");
    }

    // 토큰에서 따옴표 제거 (필요한 경우)
    const tokenString = authHeader.split(" ")[1].replace(/\"/gi, "");
    
    // 토큰 검증
    const decoded = jwt.verify(tokenString, JWT_SECRET as Secret) as TokenPayload;
    
    // 요청 객체에 사용자 정보 추가
    req.user = { userId: decoded.userId };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
};

// 선택적 인증 미들웨어 - 토큰이 있으면 검증하지만, 없어도 진행
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const tokenString = authHeader.split(" ")[1].replace(/\"/gi, "");
    const decoded = jwt.verify(tokenString, JWT_SECRET as Secret) as TokenPayload;
    
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    // 인증 실패해도 다음 미들웨어로 진행
    next();
  }
};