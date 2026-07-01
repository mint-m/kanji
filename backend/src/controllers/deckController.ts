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

    // Get current deck words with progress information
    const words = await Word.find({
      _id: { $in: progress.shuffled_order },
    }).lean();

    // Get word progress for each word
    const wordProgressPromises = progress.shuffled_order.map((wordId) =>
      WordProgress.findByUserWordAndType(userId, wordId, progressType)
    );
    const wordProgressList = await Promise.all(wordProgressPromises);

    // Combine word data with progress
    const deckWords = progress.shuffled_order.map((wordId, index) => {
      const word = words.find((w) => w._id.equals(wordId));
      const wordProgress = wordProgressList[index];

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
 * Bulk complete multiple words
 */
export const bulkCompleteWords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { progressType } = req.params as { progressType: ProgressType };
    const { completions } = req.body as {
      completions: Array<{
        wordId: string;
        isCorrect: boolean;
        timeSpent?: number;
      }>;
    };

    const userId = req.user!._id;

    if (!completions || completions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No completions provided',
      });
      return;
    }

    const results: WordCompletionResult[] = [];
    const errors: any[] = [];

    // Process each completion
    for (const completion of completions) {
      try {
        const wordObjectId = new mongoose.Types.ObjectId(completion.wordId);

        const wordProgress = await WordProgress.findOrCreate(userId, wordObjectId, progressType);

        const previousAttempts = wordProgress.try_count;

        // Record study attempt
        const studyResult = {
          isCorrect: completion.isCorrect,
          timeSpent: completion.timeSpent || 0,
          studiedAt: new Date(),
        };

        wordProgress.recordStudyAttempt(studyResult);

        if (completion.isCorrect) {
          wordProgress.markCompleted();
        } else {
          wordProgress.markIncomplete();
        }

        await wordProgress.save();

        results.push({
          wordId: wordObjectId,
          isCorrect: completion.isCorrect,
          timeSpent: completion.timeSpent,
          previousAttempts,
          newMasteryLevel: wordProgress.calculateMasteryLevel(),
          shouldRepeat: wordProgress.getRecommendedAction() === 'review',
        });
      } catch (error) {
        errors.push({
          wordId: completion.wordId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update user statistics
    const totalTimeSpent = completions.reduce((sum, c) => sum + (c.timeSpent || 0), 0);
    const correctCount = results.filter((r) => r.isCorrect).length;

    const user = await User.findById(userId);
    if (user) {
      user.updateStudyStats(totalTimeSpent, results.length);
      user.updateDailyStreak();
      await user.save();
    }

    // Auto-save checkpoint after bulk operation
    const progress = await UserCheckpoint.findByUserAndType(userId, progressType);
    if (progress) {
      progress.updateCheckpoint().catch((error: Error) => {
        console.error('Checkpoint auto-save failed:', error.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Processed ${results.length} word completions`,
      data: {
        results,
        summary: {
          totalProcessed: results.length,
          correctAnswers: correctCount,
          incorrectAnswers: results.length - correctCount,
          averageTimeSpent: totalTimeSpent / results.length,
          totalTimeSpent,
        },
        errors,
      },
    });
  } catch (error) {
    console.error('Bulk complete words error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk complete words',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get deck statistics and analytics
 */
export const getDeckStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Get word progress for all words in deck
    const wordProgressList = await WordProgress.find({
      user_id: userId,
      word_id: { $in: progress.shuffled_order },
      progress_type: progressType,
    });

    // Calculate detailed statistics
    const totalWords = progress.shuffled_order.length;
    const studiedWords = wordProgressList.length;
    const completedWords = wordProgressList.filter((wp) => wp.is_window_completed).length;
    const bookmarkedWords = wordProgressList.filter((wp) => wp.is_bookmarked).length;

    const totalAttempts = wordProgressList.reduce((sum, wp) => sum + wp.try_count, 0);
    const totalCorrect = wordProgressList.reduce((sum, wp) => sum + wp.correct_count, 0);
    const totalTimeSpent = wordProgressList.reduce((sum, wp) => sum + wp.time_spent_total, 0);

    const averageAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const averageTimePerWord = studiedWords > 0 ? totalTimeSpent / studiedWords : 0;

    // Get mastery level distribution
    const masteryDistribution = wordProgressList.reduce((acc, wp) => {
      const level = wp.calculateMasteryLevel();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sessionStats = progress.getSessionStats();

    res.status(200).json({
      success: true,
      data: {
        deckInfo: {
          level: progress.current_level,
          steps: progress.steps,
          progressType: progress.progress_type,
          totalWords,
          currentIndex: progress.current_index,
        },
        studyProgress: {
          studiedWords,
          completedWords,
          remainingWords: totalWords - progress.current_index,
          completionPercentage: sessionStats.progressPercentage,
          bookmarkedWords,
        },
        performance: {
          totalAttempts,
          totalCorrect,
          averageAccuracy: Math.round(averageAccuracy * 100) / 100,
          averageTimePerWord: Math.round(averageTimePerWord),
          totalTimeSpent,
        },
        distributions: {
          mastery: masteryDistribution,
        },
        recommendations: {
          wordsNeedingReview: wordProgressList.filter((wp) => wp.getRecommendedAction() === 'review').length,
          readyToSkip: wordProgressList.filter((wp) => wp.getRecommendedAction() === 'skip').length,
        },
      },
    });
  } catch (error) {
    console.error('Get deck stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deck statistics',
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
    const canMoveToNext = await progress.canMoveToNextWindow(userId, progressType);

    let nextWindow = null;
    let isSubLoop = false;

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
    } else if (progressType === 'sub') {
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
  bulkCompleteWords,
  getDeckStats,
  completeDeck,
};
