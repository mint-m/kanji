// src/controllers/userStatsController.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import Word from '../models/word';
import WordReview, { LONG_TERM_STAGE } from '../models/wordReview';
import StudyDay from '../models/studyDay';
import { toKstDate } from '../utils/date';
import { LEARNING_LEVELS } from '../types/common';
import { NotFoundError, InternalServerError } from '../utils/errors';

// 홈의 학습 잔디 — 최근 16주
const ACTIVITY_DAYS = 16 * 7;

// 학습 기록 — "익힌 단어"는 복습에 등록된 단어, "장기 기억"은 14일 간격 이상을 통과한 단어다.
// 윈도우를 옮길 때 리셋되는 is_window_completed로 세면 진도가 나갈수록 숫자가 줄었다 늘었다 했다
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    const now = new Date();
    const [wordCountByLevel, learnedByLevel, dueCount, nextDueAt, activity] = await Promise.all([
      Word.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
      WordReview.aggregate<{ _id: string; learned: number; longTerm: number }>([
        { $match: { user_id: userId } },
        { $lookup: { from: 'word', localField: 'word_id', foreignField: '_id', as: 'word' } },
        { $unwind: '$word' },
        {
          $group: {
            _id: '$word.level',
            learned: { $sum: 1 },
            longTerm: { $sum: { $cond: [{ $gte: ['$stage', LONG_TERM_STAGE] }, 1, 0] } },
          },
        },
      ]),
      WordReview.countDue(userId, now),
      WordReview.findNextDueAt(userId, now),
      StudyDay.findRecent(userId, ACTIVITY_DAYS, now),
    ]);

    const levels = LEARNING_LEVELS.map((level) => {
      const learned = learnedByLevel.find((row) => row._id === level);
      return {
        level,
        total: wordCountByLevel.find((row) => row._id === level)?.count ?? 0,
        learned: learned?.learned ?? 0,
        longTerm: learned?.longTerm ?? 0,
      };
    });

    res.json({
      success: true,
      data: {
        learned: {
          total: levels.reduce((sum, row) => sum + row.learned, 0),
          longTerm: levels.reduce((sum, row) => sum + row.longTerm, 0),
        },
        levels,
        review: { due: dueCount, nextDueAt },
        streak: {
          current: user.getCurrentStreak(now),
          longest: user.statistics.longestStreak,
          studyDays: user.statistics.studyDaysCount,
        },
        today: { date: toKstDate(now), count: user.getTodayCount(now), goal: user.preferences.dailyGoal },
        activity,
        totalAnswers: user.statistics.totalWordsStudied,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    next(new InternalServerError('Failed to get user statistics'));
  }
};
