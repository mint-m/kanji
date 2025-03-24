// src/controllers/userController.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import { NotFoundError, BadRequestError, InternalServerError, ForbiddenError } from "../utils/errors";

// 학습 체크포인트 업데이트
export const updateCheckpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { checkpoint, wordIndex } = req.body;

    // 인증된 사용자와 요청된 userId가 일치하는지 확인
    if (req.user?.userId !== userId) {
      return next(new ForbiddenError("You can only update your own checkpoint"));
    }

    // 체크포인트 데이터 검증
    if (!checkpoint) {
      return next(new BadRequestError("Checkpoint data is required"));
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return next(new NotFoundError("User not found"));
    }

    // 체크포인트 업데이트
    existingUser.learningCheckpoint = checkpoint;

    await existingUser.save();

    res.json(existingUser);
  } catch (error) {
    next(new InternalServerError("Failed to update checkpoint"));
  }
};