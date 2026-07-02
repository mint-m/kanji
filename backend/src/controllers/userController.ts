import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import UserCheckpoint from '../models/userCheckpoint';
import { NotFoundError, BadRequestError, InternalServerError, InvalidStepRangeError } from '../utils/errors';
import { ProgressType, LearningLevel, LEARNING_LEVELS } from '../types/common';

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

// 닉네임(이름) 업데이트
export const updateUserName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateJwt 미들웨어에서 이미 검증됨
    const userId = req.user!._id;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return next(new BadRequestError('닉네임을 입력해주세요'));
    }
    if (name.length > 20) {
      return next(new BadRequestError('닉네임은 20자 이내로 입력해주세요'));
    }

    const user = await User.findByIdAndUpdate(userId, { name }, { new: true });

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    res.json({ success: true, data: { name: user.name } });
  } catch (error) {
    console.error('Update user name error:', error);
    next(new InternalServerError('Failed to update user name'));
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
    const { progressType = 'main', level, steps, currentIndex } = req.body;

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
      if (!(LEARNING_LEVELS as readonly string[]).includes(level)) {
        return next(new BadRequestError(`유효하지 않은 레벨입니다: ${level}`));
      }

      // Find or create UserCheckpoint
      const existingProgress = await UserCheckpoint.findOne({
        user_id: userId,
        progress_type: progressType as ProgressType,
      });

      let userProgress;

      if (!existingProgress) {
        // Create new UserCheckpoint session
        try {
          userProgress = await UserCheckpoint.createNewSession(
            userId,
            progressType as ProgressType,
            level as LearningLevel,
            steps
          );
        } catch (err) {
          if (err instanceof InvalidStepRangeError) {
            return next(new BadRequestError(`선택한 레벨(${level})에 해당 범위의 단어가 없습니다. 스크립트를 먼저 실행해주세요.`));
          }
          return next(err);
        }
      } else {
        // Update existing UserCheckpoint
        existingProgress.current_level = level as LearningLevel;
        existingProgress.steps = steps;

        if (typeof currentIndex === 'number') {
          existingProgress.current_index = currentIndex;
        }

        await existingProgress.save();
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
