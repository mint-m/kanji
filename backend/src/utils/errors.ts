// src/utils/errors.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = new.target.name;

    // ES5 타깃(ts-jest)에서도 instanceof가 실제 생성한 하위 클래스를 가리키도록 new.target의 prototype을 쓴다
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, new.target);
  }
}

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
