import mongoose from 'mongoose';
import { ProgressType, LearningLevel, LEARNING_LEVELS, StepRange, SessionStats, DeckGenerationOptions } from '../types/common';
import {
  UserCheckpointDocument,
  UserCheckpointModel,
} from '../interfaces/userCheckpoint';
import SlidingWindowService from '../services/slidingWindowService';
import { InvalidStepRangeError } from '../utils/errors';
import { shuffleArray } from '../utils/shuffle';
import { WordProgressModel } from '../interfaces/wordProgress';

// 순환 의존을 피하기 위해 mongoose 레지스트리에서 동적으로 조회
const wordProgressModel = () => mongoose.model('WordProgress') as WordProgressModel;

// UserCheckpoint - Simplified learning session state
// Combines session tracking and checkpoint functionality
const userCheckpointSchema = new mongoose.Schema<UserCheckpointDocument>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    progress_type: {
      type: String,
      required: true,
      enum: ['main', 'sub'],
    },
    current_level: {
      type: String,
      required: true,
      enum: LEARNING_LEVELS,
    },
    steps: {
      start: {
        type: Number,
        required: true,
        min: 1,
      },
      end: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    shuffled_order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word',
      },
    ],
    current_index: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Instance methods
userCheckpointSchema.methods.isCompleted = function (this: UserCheckpointDocument): boolean {
  return this.current_index >= this.shuffled_order.length;
};

userCheckpointSchema.methods.getCurrentWord = function (this: UserCheckpointDocument): mongoose.Types.ObjectId | null {
  if (this.isCompleted()) return null;
  return this.shuffled_order[this.current_index];
};

userCheckpointSchema.methods.getRemainingWords = function (this: UserCheckpointDocument): mongoose.Types.ObjectId[] {
  return this.shuffled_order.slice(this.current_index);
};

userCheckpointSchema.methods.moveToNext = function (this: UserCheckpointDocument): boolean {
  if (!this.isCompleted()) {
    this.current_index++;
    return true;
  }
  return false;
};

userCheckpointSchema.methods.resetProgress = function (this: UserCheckpointDocument): void {
  this.current_index = 0;
};

userCheckpointSchema.methods.getSessionStats = function (this: UserCheckpointDocument): SessionStats {
  const totalWords = this.shuffled_order.length;
  const completedWords = this.current_index;
  const remainingWords = totalWords - completedWords;
  const progressPercentage = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;
  const totalSteps = this.steps.end - this.steps.start + 1;
  const averageWordsPerStep = totalSteps > 0 ? totalWords / totalSteps : 0;
  const currentStep = Math.floor(this.current_index / averageWordsPerStep) + this.steps.start;

  return {
    totalWords,
    completedWords,
    remainingWords,
    progressPercentage,
    averageWordsPerStep,
    currentStep: Math.min(currentStep, this.steps.end),
    totalSteps,
  };
};

userCheckpointSchema.methods.isWindowCompleted = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<boolean> {
  if (this.shuffled_order.length === 0) return false;
  const knownCount = await wordProgressModel().countDocuments({
    user_id: userId,
    word_id: { $in: this.shuffled_order },
    progress_type: progressType,
    is_window_completed: true,
  });
  return knownCount >= this.shuffled_order.length;
};

userCheckpointSchema.methods.reshuffleUnknownWords = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<number> {
  const knownIds = await wordProgressModel().distinct('word_id', {
    user_id: userId,
    word_id: { $in: this.shuffled_order },
    progress_type: progressType,
    is_window_completed: true,
  });
  const knownSet = new Set(knownIds.map((id: mongoose.Types.ObjectId) => id.toString()));

  const unknownIds = this.shuffled_order.filter((id) => !knownSet.has(id.toString()));

  this.shuffled_order = shuffleArray(unknownIds);
  this.current_index = 0;
  return this.shuffled_order.length;
};

userCheckpointSchema.methods.canMoveToNextWindow = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<boolean> {
  const allKnown = await this.isWindowCompleted(userId, progressType);
  if (!allKnown) return false;
  return await SlidingWindowService.canMoveToNextWindow(this.steps, this.current_level);
};

userCheckpointSchema.methods.generateNextSlidingWindow = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<void> {
  const nextWindow = await SlidingWindowService.getNextWindow(this.steps, this.current_level);
  if (!nextWindow) {
    throw new Error('No next window available for this level');
  }

  const nextDeck = await SlidingWindowService.generateDeck(this.current_level, nextWindow, true);

  // Reset only after deck generation succeeds to avoid data loss on failure
  await wordProgressModel().resetWindowCompletionForWords(userId, this.shuffled_order, progressType);

  this.steps = nextWindow;
  this.shuffled_order = nextDeck.wordIds;
  this.current_index = 0;
};

// Static methods
userCheckpointSchema.statics.findByUserAndType = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<UserCheckpointDocument | null> {
  return this.findOne({ user_id: userId, progress_type: type });
};

userCheckpointSchema.statics.getActiveProgressForUser = function (
  userId: mongoose.Types.ObjectId
): Promise<UserCheckpointDocument[]> {
  return this.find({ user_id: userId });
};

userCheckpointSchema.statics.createNewSession = async function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  level: LearningLevel,
  steps: StepRange
): Promise<UserCheckpointDocument> {
  // Validate step range using SlidingWindowService
  const isValidRange = await SlidingWindowService.validateStepRange(level, steps);
  if (!isValidRange) {
    throw new InvalidStepRangeError(`Invalid step range ${steps.start}-${steps.end} for level ${level}`);
  }

  // Generate deck using SlidingWindowService
  const deckWindow = await SlidingWindowService.generateDeck(level, steps, true);

  // Filter deck based on user progress (include all words for new session)
  const filteredWordIds = await (this as UserCheckpointModel).filterDeckByUserProgress(
    deckWindow.wordIds,
    userId,
    type,
    {
      excludeCompleted: false,
      prioritizeBookmarked: false,
    }
  );

  // Reset window completion state for all words in this new session
  await wordProgressModel().resetWindowCompletionForWords(userId, filteredWordIds, type);

  // Create new session
  const session = new this({
    user_id: userId,
    progress_type: type,
    current_level: level,
    steps,
    shuffled_order: filteredWordIds,
    current_index: 0,
  });

  return await session.save();
};

userCheckpointSchema.statics.filterDeckByUserProgress = async function (
  wordIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  const { excludeCompleted = true, prioritizeBookmarked = false, maxWords } = options;

  let filteredWordIds = [...wordIds];

  // Filter out window-completed words if requested
  if (excludeCompleted) {
    const completedWordIds = await wordProgressModel().distinct('word_id', {
      user_id: userId,
      word_id: { $in: filteredWordIds },
      progress_type: progressType,
      is_window_completed: true,
    });
    const completedSet = new Set(completedWordIds.map((id: mongoose.Types.ObjectId) => id.toString()));

    filteredWordIds = filteredWordIds.filter((wordId) => !completedSet.has(wordId.toString()));
  }

  // Enhanced bookmark prioritization with intelligent placement
  if (prioritizeBookmarked) {
    const bookmarkedWordIds = await wordProgressModel().distinct('word_id', {
      user_id: userId,
      word_id: { $in: filteredWordIds },
      is_bookmarked: true, // Bookmarks are cross-session
    });
    const bookmarkedSet = new Set(bookmarkedWordIds.map((id: mongoose.Types.ObjectId) => id.toString()));

    // Separate bookmarked and non-bookmarked words
    const bookmarkedWords = filteredWordIds.filter((wordId) => bookmarkedSet.has(wordId.toString()));
    const nonBookmarkedWords = filteredWordIds.filter((wordId) => !bookmarkedSet.has(wordId.toString()));

    // Shuffle both arrays independently for variety
    const shuffledBookmarks = shuffleArray(bookmarkedWords);
    const shuffledNonBookmarks = shuffleArray(nonBookmarkedWords);

    // Strategy: Distribute bookmarks in the first 40% of the deck
    // This ensures focused review while maintaining deck flow
    const totalWords = filteredWordIds.length;
    const bookmarkZoneSize = Math.ceil(totalWords * 0.4);

    // Calculate how many bookmarks can fit in the priority zone
    const bookmarksInZone = Math.min(shuffledBookmarks.length, bookmarkZoneSize);

    // Split bookmarks: priority zone vs. remaining
    const priorityBookmarks = shuffledBookmarks.slice(0, bookmarksInZone);
    const remainingBookmarks = shuffledBookmarks.slice(bookmarksInZone);

    // Interleave bookmarks with some non-bookmarked words in priority zone
    // This prevents monotony and maintains engagement
    const priorityZone: mongoose.Types.ObjectId[] = [];
    let bookmarkIndex = 0;
    let nonBookmarkIndex = 0;

    // Fill priority zone with weighted distribution (2 bookmarks : 1 regular)
    while (
      priorityZone.length < bookmarkZoneSize &&
      (bookmarkIndex < priorityBookmarks.length || nonBookmarkIndex < shuffledNonBookmarks.length)
    ) {
      // Add bookmarks (2 at a time if available)
      for (
        let i = 0;
        i < 2 && bookmarkIndex < priorityBookmarks.length && priorityZone.length < bookmarkZoneSize;
        i++
      ) {
        priorityZone.push(priorityBookmarks[bookmarkIndex++]);
      }

      // Add 1 non-bookmark for variety
      if (nonBookmarkIndex < shuffledNonBookmarks.length && priorityZone.length < bookmarkZoneSize) {
        priorityZone.push(shuffledNonBookmarks[nonBookmarkIndex++]);
      }
    }

    // Combine remaining words for the rest of the deck
    const remainingZone = [...remainingBookmarks, ...shuffledNonBookmarks.slice(nonBookmarkIndex)];

    // Final deck: priority zone + remaining zone
    filteredWordIds = [...priorityZone, ...shuffleArray(remainingZone)];
  }

  // Limit words if maxWords is specified
  if (maxWords && filteredWordIds.length > maxWords) {
    filteredWordIds = filteredWordIds.slice(0, maxWords);
  }

  return filteredWordIds;
};

// Create and export model
const UserCheckpoint = mongoose.model<UserCheckpointDocument, UserCheckpointModel>(
  'UserCheckpoint',
  userCheckpointSchema,
  'user_checkpoints'
);

export default UserCheckpoint;
