// src/utils/errors.ts
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
  
      // Error 객체 상속 관련 문제 해결 (Node.js에서의 상속)
      Error.captureStackTrace(this, this.constructor);
  
      // 클래스 이름 설정
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  // 구체적인 에러 클래스들
  export class BadRequestError extends AppError {
    constructor(message = "Bad request") {
      super(message, 400);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
      super(message, 401);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
      super(message, 403);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
      super(message, 404);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message = "Conflict") {
      super(message, 409);
    }
  }
  
  export class InternalServerError extends AppError {
    constructor(message = "Internal server error") {
      super(message, 500);
    }
  }

  export class InvalidStepRangeError extends BadRequestError {
    constructor(message = "Invalid step range") {
      super(message);
    }
  }