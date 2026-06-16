import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import UserCheckpoint from '../models/userCheckpoint';
import { NotFoundError, BadRequestError, InternalServerError } from '../utils/errors';
import { ProgressType, LearningLevel } from '../types/common';

// 사용자 프로필 조회
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateJwt 미들웨어에서 이미 검증됨
    const userId = req.user!._id;

    const user = await User.findById(userId);

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    res.json(user);
  } catch (error) {
    next(new InternalServerError('Failed to fetch user profile'));
  }
};

// 활성 진행 타입 업데이트
export const updateActiveProgressType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateJwt 미들웨어에서 이미 검증됨
    const userId = req.user!._id;
    const { activeProgressType } = req.body;

    const user = await User.findByIdAndUpdate(userId, { activeProgressType }, { new: true });

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    res.json({
      success: true,
      data: {
        activeProgressType: user.activeProgressType,
      },
    });
  } catch (error) {
    console.error('Update activeProgressType error:', error);
    next(new InternalServerError('Failed to update active progress type'));
  }
};

// 학습 체크포인트 업데이트 (UserCheckpoint 테이블과 연동)
export const updateCheckpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateJwt 미들웨어에서 이미 검증됨
    const userId = req.user!._id;
    const { checkpoint, wordIndex, progressType = 'main', level, steps, currentIndex } = req.body;

    // 사용자 확인
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return next(new NotFoundError('User not found'));
    }

    // 1. 새로운 방식: UserCheckpoint 테이블 업데이트
    if (level && steps) {
      // Validate progress type
      if (!['main', 'sub'].includes(progressType)) {
        return next(new BadRequestError('Invalid progress type. Must be "main" or "sub"'));
      }

      // Validate level
      if (!['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
        return next(new BadRequestError('Invalid level. Must be N5, N4, N3, N2, or N1'));
      }

      // Find or create UserCheckpoint
      const existingProgress = await UserCheckpoint.findOne({
        user_id: userId,
        progress_type: progressType as ProgressType,
      });

      let userProgress;

      if (!existingProgress) {
        // Create new UserCheckpoint session
        userProgress = await UserCheckpoint.createNewSession(
          userId,
          progressType as ProgressType,
          level as LearningLevel,
          steps
        );
      } else {
        // Update existing UserCheckpoint
        existingProgress.current_level = level as LearningLevel;
        existingProgress.steps = steps;

        if (typeof currentIndex === 'number') {
          existingProgress.current_index = currentIndex;
        }

        await existingProgress.save();

        // Save checkpoint using updateCheckpoint method
        await existingProgress.updateCheckpoint();

        userProgress = existingProgress;
      }

      res.json({
        success: true,
        message: 'Checkpoint updated successfully',
        data: {
          userProgress,
          user: {
            _id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name,
          },
        },
      });
    } else {
      return next(new BadRequestError('Either (level + steps) or checkpoint data is required'));
    }
  } catch (error) {
    console.error('Update checkpoint error:', error);
    next(new InternalServerError('Failed to update checkpoint'));
  }
};
