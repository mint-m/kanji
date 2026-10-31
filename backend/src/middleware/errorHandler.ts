// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

// 사용자 정의 에러 인터페이스
export interface HttpErrorInterface extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 개발 환경인지 확인
const isProduction = process.env.NODE_ENV === 'production';

// 전역 에러 핸들러 — 다른 응답과 같은 { success, message } 봉투로 내려준다
export const errorHandler = (err: HttpErrorInterface, req: Request, res: Response, next: NextFunction) => {
  // 기본 상태 코드는 500 (서버 에러)
  const statusCode = err.statusCode || 500;

  // 예상하지 못한 에러(DB 드라이버 등)의 원문은 프로덕션 응답에 싣지 않는다
  const message = !isProduction || err.isOperational ? err.message || 'Something went wrong' : 'Internal server error';

  // 로깅
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    // 개발 환경에서만 스택 트레이스 포함
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

// 존재하지 않는 라우트 핸들러
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as HttpErrorInterface;
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};
