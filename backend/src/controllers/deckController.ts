import { Request, Response } from 'express';
import mongoose from 'mongoose';
import UserProgress from '../models/userProgress';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import User from '../models/user';
import { AuthenticatedRequest } from '../middleware/auth';
import CheckpointConfig from '../config/checkpoint';
import {
  LearningLevel,
  ProgressType,
  StepRange,
  DeckGenerationOptions,
  DeckGenerationResult,
  WordCompletionResult,
} from '../types';

/**
 * Generate new sliding window deck
 */
export const generateDeck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      level,
      steps,
      progressType = 'main',
      options = {},
    } = req.body as {
      level: LearningLevel;
      steps: StepRange;
      progressType: ProgressType;
      options?: DeckGenerationOptions;
    };

    const userId = req.user!._id;

    // Validate level and steps
    if (!['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
      res.status(400).json({
        success: false,
        message: 'Invalid level. Must be N5, N4, N3, N2, or N1',
      });
      return;
    }

    if (steps.start < 1 || steps.end > 10 || steps.start > steps.end) {
      res.status(400).json({
        success: false,
        message: 'Invalid step range. Steps must be 1-10 with start <= end',
      });
      return;
    }

    // Set default options
    const deckOptions: DeckGenerationOptions = {
      excludeCompleted: options.excludeCompleted ?? true,
      prioritizeBookmarked: options.prioritizeBookmarked ?? false,
      shuffleOrder: options.shuffleOrder ?? true,
      maxWords: options.maxWords,
    };

    // Generate deck using UserProgress model
    const shuffledOrder = await UserProgress.generateSlidingWindowDeck(level, steps, userId, deckOptions);

    if (shuffledOrder.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No words found for the specified criteria. Try different level/steps or include completed words.',
        data: { level, steps, options: deckOptions },
      });
      return;
    }

    // Get detailed word information
    const words = await Word.find({
      _id: { $in: shuffledOrder },
    }).lean();

    // Reorder words according to shuffled order
    const orderedWords = shuffledOrder.map((id) => words.find((word) => word._id.equals(id))).filter(Boolean);

    // Calculate statistics
    const completedWordIds = await WordProgress.find({
      user_id: userId,
      progress_type: progressType,
      is_completed: true,
    }).distinct('word_id');

    const bookmarkedWordIds = await WordProgress.find({
      user_id: userId,
      is_bookmarked: true,
    }).distinct('word_id');

    const excludedCompleted = deckOptions.excludeCompleted ? completedWordIds.length : 0;

    const prioritizedBookmarks = deckOptions.prioritizeBookmarked
      ? orderedWords.filter((word) => bookmarkedWordIds.some((bookmarkId) => bookmarkId.equals(word!._id))).length
      : 0;

    // Estimate study time (2 minutes per word on average)
    const estimatedStudyTime = Math.ceil(orderedWords.length * 2);

    // Generate deck ID for tracking
    const deckId = `${userId}_${level}_${steps.start}-${steps.end}_${progressType}_${Date.now()}`;

    const deckResult: DeckGenerationResult = {
      deckId,
      words: orderedWords,
      totalWords: orderedWords.length,
      level,
      steps,
      excludedCompleted,
      prioritizedBookmarks,
      options: deckOptions,
      generatedAt: new Date(),
      estimatedStudyTime,
    };

    res.status(200).json({
      success: true,
      message: 'Deck generated successfully',
      data: deckResult,
    });
  } catch (error) {
    console.error('Generate deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate deck',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

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

    let progress = await UserProgress.findByUserAndType(userId, progressType);

    if (!progress) {
      console.log(`[Auto-Create] No ${progressType} session found for user ${userId}`);

      try {
        const user = await User.findById(userId);
        const checkpoint = user?.learningCheckpoint;

        let level: LearningLevel;
        let steps: { start: number; end: number };

        // 신규 사용자
        level = 'N5';
        steps = { start: 1, end: 3 };

        console.log(`[Auto-Create] New user: starting at ${level} ${steps.start}-${steps.end}`);

        // 단어 조회
        const words = await Word.find({
          level,
          step: { $gte: steps.start, $lte: steps.end },
        }).lean();

        if (words.length === 0) {
          res.status(400).json({
            success: false,
            message: `No words found for ${level} steps ${steps.start}-${steps.end}`,
          });
          return;
        }

        // UserProgress 생성
        const wordIds = words.map((w) => w._id);

        progress = await UserProgress.create({
          user_id: userId,
          progress_type: progressType,
          current_level: level,
          steps,
          shuffled_order: wordIds,
          current_index: 0,
        });

        console.log(`[Auto-Create] ✅ Created ${progressType} session with ${wordIds.length} words`);
      } catch (error) {
        console.error('[Auto-Create] Failed:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create learning session',
          error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
        return;
      }
    }

    // TypeScript assertion: progress is guaranteed to exist here
    if (!progress) {
      res.status(500).json({
        success: false,
        message: 'Failed to load or create learning session',
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
        isCompleted: wordProgress?.is_completed || false,
        isBookmarked: wordProgress?.is_bookmarked || false,
        studyStats: wordProgress?.getStudyStats(),
        recommendedAction: wordProgress?.getRecommendedAction(),
      };
    });

    const sessionStats = progress.getSessionStats();

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
          isCompleted: progress.isCompleted(),
          canMoveToNext: await progress.canMoveToNextWindow(),
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
    const { wordId, isCorrect, timeSpent, difficulty } = req.body as {
      wordId: string;
      isCorrect: boolean;
      timeSpent?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    };

    const userId = req.user!._id;
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    // Get current session
    const progress = await UserProgress.findByUserAndType(userId, progressType);
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

    // Find or create word progress
    let wordProgress = await WordProgress.findByUserWordAndType(userId, wordObjectId, progressType);
    if (!wordProgress) {
      wordProgress = await WordProgress.findOrCreate(userId, wordObjectId, progressType);
    }

    const previousAttempts = wordProgress.try_count;

    // Record the study attempt
    const studyResult = {
      isCorrect,
      timeSpent: timeSpent || 0,
      difficulty:
        difficulty ||
        (wordProgress.difficulty_rating >= 4 ? 'hard' : wordProgress.difficulty_rating >= 2 ? 'medium' : 'easy'),
      studiedAt: new Date(),
    };

    wordProgress.recordStudyAttempt(studyResult);

    // Update completion status
    if (isCorrect) {
      wordProgress.markCompleted(timeSpent);
    } else {
      wordProgress.markIncomplete(timeSpent);
    }

    await wordProgress.save();

    // Get updated analytics
    const newMasteryLevel = wordProgress.calculateMasteryLevel();
    const recommendedAction = wordProgress.getRecommendedAction();
    const shouldRepeat = recommendedAction === 'intensive_practice' || recommendedAction === 'review';

    const completionResult: WordCompletionResult = {
      wordId: wordObjectId,
      isCorrect,
      timeSpent,
      difficulty: studyResult.difficulty,
      previousAttempts,
      newMasteryLevel,
      shouldRepeat,
    };

    // Update user statistics
    const user = await User.findById(userId);
    if (user) {
      user.updateStudyStats(timeSpent || 0, 1);
      if (isCorrect) {
        user.incrementStreak();
      }
      await user.save();
    }

    // Move to next word in progress if not at the end
    if (progress.current_index < progress.shuffled_order.length - 1) {
      progress.moveToNext();
      await progress.save();
    }

    // Auto-save checkpoint based on configuration
    // Development: every word (interval=1)
    // Production: every 5 words or on completion (interval=5)
    if (CheckpointConfig.shouldSaveCheckpoint(progress.current_index, progress.isCompleted())) {
      CheckpointConfig.log(
        `Auto-saving checkpoint for user ${userId}, type ${progressType}, index ${progress.current_index}`
      );
      UserProgress.saveCheckpoint(userId, progressType).catch((error) => {
        CheckpointConfig.logError('Checkpoint auto-save failed', error);
      });
    }

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
        isSessionCompleted: progress.isCompleted(),
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
        difficulty?: 'easy' | 'medium' | 'hard';
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

        let wordProgress = await WordProgress.findByUserWordAndType(userId, wordObjectId, progressType);
        if (!wordProgress) {
          wordProgress = await WordProgress.findOrCreate(userId, wordObjectId, progressType);
        }

        const previousAttempts = wordProgress.try_count;

        // Record study attempt
        const studyResult = {
          isCorrect: completion.isCorrect,
          timeSpent: completion.timeSpent || 0,
          difficulty: completion.difficulty || 'medium',
          studiedAt: new Date(),
        };

        wordProgress.recordStudyAttempt(studyResult);

        if (completion.isCorrect) {
          wordProgress.markCompleted(completion.timeSpent);
        } else {
          wordProgress.markIncomplete(completion.timeSpent);
        }

        await wordProgress.save();

        results.push({
          wordId: wordObjectId,
          isCorrect: completion.isCorrect,
          timeSpent: completion.timeSpent,
          difficulty: studyResult.difficulty,
          previousAttempts,
          newMasteryLevel: wordProgress.calculateMasteryLevel(),
          shouldRepeat: wordProgress.getRecommendedAction() === 'intensive_practice',
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
      if (correctCount > 0) {
        user.incrementStreak();
      } else if (results.length > correctCount) {
        user.resetStreak();
      }
      await user.save();
    }

    // Auto-save checkpoint after bulk operation
    CheckpointConfig.log(`Auto-saving checkpoint after bulk operation (${results.length} words)`);
    UserProgress.saveCheckpoint(userId, progressType).catch((error) => {
      CheckpointConfig.logError('Checkpoint auto-save failed after bulk operation', error);
    });

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

    const progress = await UserProgress.findByUserAndType(userId, progressType);

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
    const completedWords = wordProgressList.filter((wp) => wp.is_completed).length;
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

    // Get difficulty distribution
    const difficultyDistribution = wordProgressList.reduce((acc, wp) => {
      const difficulty = wp.difficulty_rating;
      if (difficulty <= 2) acc.easy = (acc.easy || 0) + 1;
      else if (difficulty <= 4) acc.medium = (acc.medium || 0) + 1;
      else acc.hard = (acc.hard || 0) + 1;
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
          difficulty: difficultyDistribution,
        },
        recommendations: {
          wordsNeedingReview: wordProgressList.filter((wp) => wp.getRecommendedAction() === 'review').length,
          wordsForIntensivePractice: wordProgressList.filter((wp) => wp.getRecommendedAction() === 'intensive_practice')
            .length,
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
    const { autoGenerateNext = true, sessionFeedback } = req.body as {
      autoGenerateNext?: boolean;
      sessionFeedback?: {
        difficulty: 'too_easy' | 'just_right' | 'too_hard';
        enjoyment: number; // 1-5 scale
        notes?: string;
      };
    };

    const userId = req.user!._id;

    const progress = await UserProgress.findByUserAndType(userId, progressType);
    if (!progress) {
      res.status(404).json({
        success: false,
        message: `No active ${progressType} session found`,
      });
      return;
    }

    if (!progress.isCompleted()) {
      res.status(400).json({
        success: false,
        message: 'Deck is not completed yet. Study all words first.',
      });
      return;
    }

    // Save checkpoint before transitioning to next window
    await UserProgress.saveCheckpoint(userId, progressType);

    // Get final deck statistics
    const finalStats = progress.getSessionStats();
    const canMoveToNext = await progress.canMoveToNextWindow();

    let nextWindow = null;
    if (autoGenerateNext && canMoveToNext) {
      try {
        await progress.generateNextSlidingWindow();
        await progress.save();

        // Save checkpoint after generating next window
        await UserProgress.saveCheckpoint(userId, progressType);

        nextWindow = {
          level: progress.current_level,
          steps: progress.steps,
          deckSize: progress.shuffled_order.length,
        };
      } catch (error) {
        console.error('Failed to generate next window:', error);
      }
    }

    // Update user completion statistics
    const user = await User.findById(userId);
    if (user && !user.statistics.levelsCompleted.includes(progress.current_level)) {
      // Check if this level is fully completed
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
        levelCompleted: user?.statistics.levelsCompleted.includes(progress.current_level),
        sessionFeedback,
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
  generateDeck,
  getCurrentDeck,
  completeWord,
  bulkCompleteWords,
  getDeckStats,
  completeDeck,
};
