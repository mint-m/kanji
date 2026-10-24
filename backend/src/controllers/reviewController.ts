import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import WordReview from '../models/wordReview';
import Word from '../models/word';
import WordProgress from '../models/wordProgress';
import User from '../models/user';
import { AuthenticatedRequest } from '../middleware/auth';
import { InternalServerError, NotFoundError } from '../utils/errors';
import { shuffleArray } from '../utils/shuffle';

/**
 * 오늘 복습할 단어 — 기한이 지난 순서로 limit개를 골라 섞어 준다
 * @route GET /api/users/me/reviews/due
 */
export const getDueReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const limit = Number(req.query.limit) || 50;
    const now = new Date();

    const [reviews, dueCount] = await Promise.all([
      WordReview.find({ user_id: userId, next_review_at: { $lte: now } }).sort({ next_review_at: 1 }).limit(limit).lean(),
      WordReview.countDue(userId, now),
    ]);

    const wordIds = reviews.map((review) => review.word_id);
    // 북마크는 세션 간 공유되므로 progress_type과 무관하게 조회
    const [words, bookmarkedIds] = await Promise.all([
      Word.find({ _id: { $in: wordIds } }).lean(),
      WordProgress.distinct('word_id', { user_id: userId, word_id: { $in: wordIds }, is_bookmarked: true }),
    ]);
    const wordMap = new Map(words.map((word) => [String(word._id), word]));
    const bookmarkedSet = new Set(bookmarkedIds.map((id: mongoose.Types.ObjectId) => String(id)));

    const items = reviews.flatMap((review) => {
      const word = wordMap.get(String(review.word_id));
      return word ? [{ ...word, stage: review.stage, isBookmarked: bookmarkedSet.has(String(review.word_id)) }] : [];
    });

    res.json({ success: true, data: { words: shuffleArray(items), dueCount } });
  } catch (error) {
    console.error('Get due reviews error:', error);
    next(new InternalServerError('Failed to load reviews'));
  }
};

/**
 * 복습 응답 — 알아요는 다음 간격으로, 몰라요는 0단계(바로 다시)로 옮긴다
 * @route POST /api/users/me/reviews/answer
 */
export const answerReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const { wordId, isCorrect, timeSpent } = req.body as { wordId: string; isCorrect: boolean; timeSpent?: number };

    const review = await WordReview.findOne({ user_id: userId, word_id: wordId });
    if (!review) {
      return next(new NotFoundError('This word is not scheduled for review'));
    }

    // 아직 기한 전이면(같은 응답의 재전송 등) 다시 반영하지 않는다
    const applied = review.applyAnswer(isCorrect);
    if (applied) {
      await review.save();
      const user = await User.findById(userId);
      if (user) {
        user.recordStudy(timeSpent || 0);
        await user.save();
      }
    }

    res.json({ success: true, data: { applied, stage: review.stage, nextReviewAt: review.next_review_at } });
  } catch (error) {
    console.error('Answer review error:', error);
    next(new InternalServerError('Failed to record review'));
  }
};

export default {
  getDueReviews,
  answerReview,
};
