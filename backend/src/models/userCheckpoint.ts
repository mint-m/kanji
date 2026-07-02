import mongoose from 'mongoose';
import { ProgressType, LearningLevel, LEARNING_LEVELS, StepRange, SessionStats, DeckGenerationOptions } from '../types/common';
import {
  UserCheckpointDocument,
  UserCheckpointModel,
} from '../interfaces/userCheckpoint';
import SlidingWindowService from '../services/slidingWindowService';
import { InvalidStepRangeError } from '../utils/errors';

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

userCheckpointSchema.methods.moveToPrevious = function (this: UserCheckpointDocument): boolean {
  if (this.current_index > 0) {
    this.current_index--;
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

// Simplified checkpoint update - just saves the document
userCheckpointSchema.methods.updateCheckpoint = async function (this: UserCheckpointDocument): Promise<boolean> {
  try {
    await this.save();
    return true;
  } catch (error) {
    console.error('Failed to update checkpoint:', error);
    return false;
  }
};

userCheckpointSchema.methods.isWindowCompleted = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<boolean> {
  if (this.shuffled_order.length === 0) return false;
  const WordProgress = mongoose.model('WordProgress');
  const knownCount = await WordProgress.countDocuments({
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
  const WordProgress = mongoose.model('WordProgress');
  const knownIds = await WordProgress.find({
    user_id: userId,
    word_id: { $in: this.shuffled_order },
    progress_type: progressType,
    is_window_completed: true,
  }).distinct('word_id');
  const knownSet = new Set(knownIds.map((id: mongoose.Types.ObjectId) => id.toString()));

  const unknownIds = this.shuffled_order.filter((id) => !knownSet.has(id.toString()));

  const UserCheckpointModel = this.constructor as UserCheckpointModel;
  this.shuffled_order = UserCheckpointModel.shuffleArray(unknownIds);
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
  const WordProgress = mongoose.model('WordProgress');
  await WordProgress.updateMany(
    { user_id: userId, word_id: { $in: this.shuffled_order }, progress_type: progressType },
    { $set: { is_window_completed: false } }
  );

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
  const WordProgress = mongoose.model('WordProgress');
  await WordProgress.updateMany(
    { user_id: userId, word_id: { $in: filteredWordIds }, progress_type: type },
    { $set: { is_window_completed: false } }
  );

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

userCheckpointSchema.statics.generateSlidingWindowDeck = async function (
  level: LearningLevel,
  steps: StepRange,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  const deckWindow = await SlidingWindowService.generateDeck(level, steps, options.shuffleOrder !== false);

  return await (this as UserCheckpointModel).filterDeckByUserProgress(
    deckWindow.wordIds,
    userId,
    progressType,
    options
  );
};

userCheckpointSchema.statics.filterDeckByUserProgress = async function (
  wordIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  const { excludeCompleted = true, prioritizeBookmarked = false, maxWords } = options;

  // Import models dynamically to avoid circular dependency
  const WordProgress = mongoose.model('WordProgress');

  let filteredWordIds = [...wordIds];

  // Filter out window-completed words if requested
  if (excludeCompleted) {
    const completedWordIds = await WordProgress.find({
      user_id: userId,
      word_id: { $in: filteredWordIds },
      progress_type: progressType,
      is_window_completed: true,
    }).distinct('word_id');
    const completedSet = new Set(completedWordIds.map((id: mongoose.Types.ObjectId) => id.toString()));

    filteredWordIds = filteredWordIds.filter((wordId) => !completedSet.has(wordId.toString()));
  }

  // Enhanced bookmark prioritization with intelligent placement
  if (prioritizeBookmarked) {
    const bookmarkedWordIds = await WordProgress.find({
      user_id: userId,
      word_id: { $in: filteredWordIds },
      is_bookmarked: true, // Bookmarks are cross-session
    }).distinct('word_id');
    const bookmarkedSet = new Set(bookmarkedWordIds.map((id: mongoose.Types.ObjectId) => id.toString()));

    // Separate bookmarked and non-bookmarked words
    const bookmarkedWords = filteredWordIds.filter((wordId) => bookmarkedSet.has(wordId.toString()));
    const nonBookmarkedWords = filteredWordIds.filter((wordId) => !bookmarkedSet.has(wordId.toString()));

    // Shuffle both arrays independently for variety
    const shuffledBookmarks = (this as UserCheckpointModel).shuffleArray(bookmarkedWords);
    const shuffledNonBookmarks = (this as UserCheckpointModel).shuffleArray(nonBookmarkedWords);

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
    filteredWordIds = [...priorityZone, ...(this as UserCheckpointModel).shuffleArray(remainingZone)];
  }

  // Limit words if maxWords is specified
  if (maxWords && filteredWordIds.length > maxWords) {
    filteredWordIds = filteredWordIds.slice(0, maxWords);
  }

  return filteredWordIds;
};

/**
 * Utility: Fisher-Yates shuffle for array randomization
 */
userCheckpointSchema.statics.shuffleArray = function <T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

userCheckpointSchema.statics.getNextSlidingWindow = async function (
  currentSteps: StepRange,
  level: LearningLevel
): Promise<StepRange | null> {
  // Use SlidingWindowService for getting next window
  return await SlidingWindowService.getNextWindow(currentSteps, level);
};

userCheckpointSchema.statics.getUserLearningStats = async function (userId: mongoose.Types.ObjectId): Promise<any> {
  const stats = await this.aggregate([
    { $match: { user_id: userId } },
    {
      $lookup: {
        from: 'word_progress',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'wordProgress',
      },
    },
    {
      $group: {
        _id: '$progress_type',
        sessions: { $sum: 1 },
        totalWords: { $sum: { $size: '$shuffled_order' } },
        completedWords: { $sum: '$current_index' },
        levels: { $addToSet: '$current_level' },
        avgProgress: {
          $avg: {
            $cond: [
              { $gt: [{ $size: '$shuffled_order' }, 0] },
              { $divide: ['$current_index', { $size: '$shuffled_order' }] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return stats;
};

// Create and export model
const UserCheckpoint = mongoose.model<UserCheckpointDocument, UserCheckpointModel>(
  'UserCheckpoint',
  userCheckpointSchema,
  'user_checkpoints'
);

export default UserCheckpoint;
