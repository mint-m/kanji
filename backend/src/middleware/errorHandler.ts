// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

// 사용자 정의 에러 인터페이스
export interface HttpErrorInterface extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 개발 환경인지 확인
const isProduction = process.env.NODE_ENV === "production";

// 전역 에러 핸들러
export const errorHandler = (
  err: HttpErrorInterface,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 기본 상태 코드는 500 (서버 에러)
  const statusCode = err.statusCode || 500;
  
  // 응답 객체
  const response = {
    status: "error",
    message: err.message || "Something went wrong",
    // 개발 환경에서만 스택 트레이스 포함
    ...(isProduction ? {} : { stack: err.stack, error: err })
  };

  // 로깅
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    statusCode,
    message: err.message,
    stack: isProduction ? undefined : err.stack
  });

  // 클라이언트에게 에러 응답 전송
  res.status(statusCode).json(response);
};

// 존재하지 않는 라우트 핸들러
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as HttpErrorInterface;
  error.statusCode = 404;
  next(error);
};