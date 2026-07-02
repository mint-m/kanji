import { Response } from 'express';
import mongoose from 'mongoose';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import User from '../models/user';
import SlidingWindowService from '../services/slidingWindowService';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  ProgressType,
  WordCompletionResult,
} from '../types';

/**
 * Get current deck from active session
 */
export const getCurrentDeck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { progressType } = req.params as { progressType: ProgressType };
    const userId = req.user!._id;

    if (!['main', 'sub'].includes(progressType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid progress type. Must be "main" or "sub"',
      });
      return;
    }

    const progress = await UserCheckpoint.findByUserAndType(userId, progressType);

    if (!progress) {
      res.status(404).json({
        success: false,
        code: 'NO_PROGRESS',
        message: `No active ${progressType} session found. Please select a level to start.`,
      });
      return;
    }

    // Get current deck words and their progress in two batch queries
    const [words, wordProgressList] = await Promise.all([
      Word.find({ _id: { $in: progress.shuffled_order } }).lean(),
      WordProgress.find({
        user_id: userId,
        word_id: { $in: progress.shuffled_order },
        progress_type: progressType,
      }),
    ]);

    const wordById = new Map(words.map((w) => [w._id.toString(), w]));
    const progressByWordId = new Map(wordProgressList.map((wp) => [wp.word_id.toString(), wp]));

    // Combine word data with progress
    const deckWords = progress.shuffled_order.map((wordId, index) => {
      const word = wordById.get(wordId.toString());
      const wordProgress = progressByWordId.get(wordId.toString());

      return {
        ...word,
        index,
        isCurrent: index === progress!.current_index,
        isWindowCompleted: wordProgress?.is_window_completed || false,
        isBookmarked: wordProgress?.is_bookmarked || false,
        studyStats: wordProgress?.getStudyStats(),
        recommendedAction: wordProgress?.getRecommendedAction(),
      };
    });

    const sessionStats = progress.getSessionStats();
    const isWindowComplete = await progress.isWindowCompleted(userId, progressType);
    const canMoveToNext = isWindowComplete
      && await SlidingWindowService.canMoveToNextWindow(progress.steps, progress.current_level);

    res.status(200).json({
      success: true,
      data: {
        deckId: `${userId}_${progress.current_level}_${progress.steps.start}-${progress.steps.end}_${progressType}`,
        level: progress.current_level,
        steps: progress.steps,
        progressType: progress.progress_type,
        words: deckWords,
        currentIndex: progress.current_index,
        sessionStats,
        deckStatus: {
          isPassComplete: progress.isCompleted(),
          isWindowComplete,
          canMoveToNext,
          completionPercentage: sessionStats.progressPercentage,
        },
        createdAt: progress.created_at,
        updatedAt: progress.updated_at,
      },
    });
  } catch (error) {
    console.error('Get current deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current deck',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Mark word as completed or incorrect in current deck
 */
export const completeWord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { progressType } = req.params as { progressType: ProgressType };
    const { wordId, isCorrect, timeSpent } = req.body as {
      wordId: string;
      timeSpent: number;
      isCorrect: boolean;
    };

    const userId = req.user!._id;
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    // Get current session
    const progress = await UserCheckpoint.findByUserAndType(userId, progressType);

    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No active ${progressType} session found`,
      });
      return;
    }

    // Verify word is in current deck
    if (!progress.shuffled_order.some((id) => id.equals(wordObjectId))) {
      res.status(400).json({
        success: false,
        message: 'Word is not in current deck',
      });
      return;
    }

    const wordProgress = await WordProgress.findOrCreate(userId, wordObjectId, progressType);
    const previousAttempts = wordProgress.try_count;

    // Record historical study stats
    wordProgress.recordStudyAttempt({ isCorrect, studiedAt: new Date(), timeSpent: timeSpent || 0 });

    // Update window-scoped completion flag
    if (isCorrect) {
      wordProgress.markCompleted();
    } else {
      wordProgress.markIncomplete();
    }

    await wordProgress.save();

    const newMasteryLevel = wordProgress.calculateMasteryLevel();
    const recommendedAction = wordProgress.getRecommendedAction();

    const completionResult: WordCompletionResult = {
      wordId: wordObjectId,
      isCorrect,
      timeSpent,
      previousAttempts,
      newMasteryLevel,
      shouldRepeat: recommendedAction === 'review',
    };

    // Update user statistics
    const user = await User.findById(userId);
    if (user) {
      user.updateStudyStats(timeSpent || 0, 1);
      user.updateDailyStreak();
      await user.save();
    }

    // Always advance index (moveToNext guards against overflow)
    progress.moveToNext();

    // Detect pass completion
    const isPassComplete = progress.isCompleted();
    let windowComplete = false;
    let nextPassSize: number | undefined;

    if (isPassComplete) {
      windowComplete = await progress.isWindowCompleted(userId, progressType);
      if (!windowComplete) {
        // Reshuffle unknown words for next pass
        nextPassSize = await progress.reshuffleUnknownWords(userId, progressType);
      }
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: isCorrect ? 'Word marked as completed' : 'Word marked as incorrect',
      data: {
        completion: completionResult,
        wordProgress: {
          totalAttempts: wordProgress.try_count,
          successRate: (wordProgress.correct_count / wordProgress.try_count) * 100,
          studyStreak: wordProgress.study_streak,
          masteryLevel: newMasteryLevel,
          recommendedAction,
          isBookmarked: wordProgress.is_bookmarked,
        },
        currentIndex: progress.current_index,
        passComplete: isPassComplete,
        windowComplete,
        ...(isPassComplete && !windowComplete && { nextPassSize }),
      },
    });
  } catch (error) {
    console.error('Complete word error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete word',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Complete entire deck and prepare for next sliding window
 */
export const completeDeck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { progressType } = req.params as { progressType: ProgressType };
    const userId = req.user!._id;

    const progress = await UserCheckpoint.findByUserAndType(userId, progressType);
    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No active ${progressType} session found`,
      });
      return;
    }

    const allKnown = await progress.isWindowCompleted(userId, progressType);
    if (!allKnown) {
      res.status(400).json({
        success: false,
        message: 'Window is not completed yet. All words must be marked as known first.',
      });
      return;
    }

    const finalStats = progress.getSessionStats();

    let nextWindow = null;
    let isSubLoop = false;
    let canMoveToNext = false;

    if (progressType === 'sub') {
      // 서브 세션 집중 루프: 같은 스텝을 재셔플해서 다시 시작
      await WordProgress.updateMany(
        { user_id: userId, word_id: { $in: progress.shuffled_order }, progress_type: 'sub' },
        { $set: { is_window_completed: false } }
      );
      const shuffled = [...progress.shuffled_order];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      progress.shuffled_order = shuffled as mongoose.Types.ObjectId[];
      progress.markModified('shuffled_order');
      progress.current_index = 0;
      await progress.save();
      isSubLoop = true;
      nextWindow = {
        level: progress.current_level,
        steps: progress.steps,
        deckSize: progress.shuffled_order.length,
      };
    } else {
      // allKnown은 위에서 이미 확인됨 — 다음 윈도우 존재 여부만 확인
      canMoveToNext = await SlidingWindowService.canMoveToNextWindow(progress.steps, progress.current_level);
      if (canMoveToNext) {
        try {
          await progress.generateNextSlidingWindow(userId, progressType);
          await progress.save();

          nextWindow = {
            level: progress.current_level,
            steps: progress.steps,
            deckSize: progress.shuffled_order.length,
          };
        } catch (error) {
          console.error('Failed to generate next window:', error);
        }
      }
    }

    const user = await User.findById(userId);
    if (user && !user.statistics.levelsCompleted.includes(progress.current_level)) {
      const levelStats = await Word.getLevelStats(progress.current_level);
      if (levelStats.length > 0) {
        const maxStep = levelStats[0].maxStep;
        if (progress.steps.end >= maxStep) {
          user.statistics.levelsCompleted.push(progress.current_level);
          await user.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Deck completed successfully',
      data: {
        completedDeck: {
          level: progress.current_level,
          steps: progress.steps,
          progressType: progress.progress_type,
          finalStats,
          completedAt: new Date(),
        },
        nextWindow,
        canGenerateNext: canMoveToNext,
        isSubLoop,
        levelCompleted: user?.statistics.levelsCompleted.includes(progress.current_level),
      },
    });
  } catch (error) {
    console.error('Complete deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete deck',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  getCurrentDeck,
  completeWord,
  completeDeck,
};
