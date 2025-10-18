import mongoose from 'mongoose';
import {
  UserProgressDocument,
  UserProgressModel,
  ProgressType,
  LearningLevel,
  StepRange,
  SessionStats,
  DeckGenerationOptions,
} from '../interfaces/userProgress';
import SlidingWindowService from '../services/slidingWindowService';
import CheckpointService from '../services/checkpointService';

// UserProgress - Learning session state
// Tracks user's current position in sliding window deck system
const userProgressSchema = new mongoose.Schema<UserProgressDocument>(
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
      enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
    },
    steps: {
      start: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
      end: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
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

// Compound indexes for efficient queries
userProgressSchema.index({ user_id: 1, progress_type: 1 }, { unique: true });
userProgressSchema.index({ user_id: 1, current_level: 1 });

// Validation: ensure start <= end for steps
userProgressSchema.pre('save', function (this: any, next: Function) {
  if (this.steps.start > this.steps.end) {
    const error = new Error('Step start must be less than or equal to step end');
    return next(error);
  }
  next();
});

// Instance methods
userProgressSchema.methods.isCompleted = function (this: UserProgressDocument): boolean {
  return this.current_index >= this.shuffled_order.length;
};

userProgressSchema.methods.getCurrentWord = function (this: UserProgressDocument): mongoose.Types.ObjectId | null {
  if (this.isCompleted()) return null;
  return this.shuffled_order[this.current_index];
};

userProgressSchema.methods.getRemainingWords = function (this: UserProgressDocument): mongoose.Types.ObjectId[] {
  return this.shuffled_order.slice(this.current_index);
};

userProgressSchema.methods.moveToNext = function (this: UserProgressDocument): boolean {
  if (!this.isCompleted()) {
    this.current_index++;
    return true;
  }
  return false;
};

userProgressSchema.methods.moveToPrevious = function (this: UserProgressDocument): boolean {
  if (this.current_index > 0) {
    this.current_index--;
    return true;
  }
  return false;
};

userProgressSchema.methods.resetProgress = function (this: UserProgressDocument): void {
  this.current_index = 0;
};

userProgressSchema.methods.getSessionStats = function (this: UserProgressDocument): SessionStats {
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

userProgressSchema.methods.canMoveToNextWindow = async function (this: UserProgressDocument): Promise<boolean> {
  // Check if current deck is completed and if there are more steps available
  if (!this.isCompleted()) return false;

  // Use SlidingWindowService to check if next window is available
  return SlidingWindowService.canMoveToNextWindow(this.steps, this.current_level);
};

userProgressSchema.methods.generateNextSlidingWindow = async function (this: UserProgressDocument): Promise<void> {
  // 1. 이동 가능 여부 체크
  const canMove = await this.canMoveToNextWindow();
  if (!canMove) {
    throw new Error('Cannot generate next window - no more windows available or current deck not completed');
  }

  // 2. 다음 윈도우 가져오기 (Service가 알아서 DB 조회)
  const nextWindow = await SlidingWindowService.getNextWindow(this.steps, this.current_level);

  if (!nextWindow) {
    throw new Error('No next window available for this level');
  }

  // 3. Checkpoint 저장 (현재 상태 백업)
  await CheckpointService.saveCheckpoint(
    this.user_id,
    this.progress_type,
    {
      level: this.current_level,
      steps: this.steps,
      wordIds: this.shuffled_order,
      windowIndex: 0, // TODO: 실제 windowIndex 계산 필요 시 추가
      isCircular: SlidingWindowService.isCircularWindow(this.steps),
      totalWindows: (await SlidingWindowService.generateAllWindows(this.current_level)).length,
    },
    this.current_index,
    this.shuffled_order
  );

  // 4. 새 윈도우에 대한 덱 생성
  const nextDeck = await SlidingWindowService.generateDeck(
    this.current_level,
    nextWindow,
    true // shuffled
  );

  // 5. Progress 상태 업데이트 (한 번만!)
  this.steps = nextWindow;
  this.shuffled_order = nextDeck.wordIds;
  this.current_index = 0; // 새 덱 시작점
  this.updated_at = new Date();

  // 6. 저장은 호출하는 쪽에서 해야 함
  // await this.save(); // 필요 시 추가
};

// Static methods
userProgressSchema.statics.findByUserAndType = function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType
): Promise<UserProgressDocument | null> {
  return this.findOne({ user_id: userId, progress_type: type });
};

userProgressSchema.statics.getActiveProgressForUser = function (
  userId: mongoose.Types.ObjectId
): Promise<UserProgressDocument[]> {
  return this.find({ user_id: userId });
};

userProgressSchema.statics.createNewSession = async function (
  userId: mongoose.Types.ObjectId,
  type: ProgressType,
  level: LearningLevel,
  steps: StepRange
): Promise<UserProgressDocument> {
  // Validate step range using SlidingWindowService
  const isValidRange = await SlidingWindowService.validateStepRange(level, steps);
  if (!isValidRange) {
    throw new Error(`Invalid step range ${steps.start}-${steps.end} for level ${level}`);
  }

  // Generate deck using SlidingWindowService
  const deckWindow = await SlidingWindowService.generateDeck(level, steps, true);

  // Filter deck based on user progress (exclude completed, prioritize bookmarked)
  const filteredWordIds = await (this as UserProgressModel).filterDeckByUserProgress(deckWindow.wordIds, userId, type, {
    excludeCompleted: true,
    prioritizeBookmarked: false,
  });

  // Create new session
  const session = new this({
    user_id: userId,
    progress_type: type,
    current_level: level,
    steps,
    shuffled_order: filteredWordIds,
    current_index: 0,
  });

  const savedSession = await session.save();

  // Create initial checkpoint
  await CheckpointService.saveCheckpoint(userId, type, deckWindow, 0, filteredWordIds);

  return savedSession;
};

userProgressSchema.statics.generateSlidingWindowDeck = async function (
  level: LearningLevel,
  steps: StepRange,
  userId: mongoose.Types.ObjectId,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  // Use SlidingWindowService for deck generation
  const deckWindow = await SlidingWindowService.generateDeck(level, steps, options.shuffleOrder !== false);

  // Filter deck based on user progress
  return await (this as UserProgressModel).filterDeckByUserProgress(
    deckWindow.wordIds,
    userId,
    'main', // Default to main for filtering
    options
  );
};

userProgressSchema.statics.filterDeckByUserProgress = async function (
  wordIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  const { excludeCompleted = true, prioritizeBookmarked = false, maxWords } = options;

  // Import models dynamically to avoid circular dependency
  const WordProgress = mongoose.model('WordProgress');

  let filteredWordIds = [...wordIds];

  // Filter out completed words if requested
  if (excludeCompleted) {
    const completedWordIds = await WordProgress.find({
      user_id: userId,
      progress_type: progressType,
      is_completed: true,
    }).distinct('word_id');

    filteredWordIds = filteredWordIds.filter(
      (wordId) => !completedWordIds.some((completedId) => completedId.equals(wordId))
    );
  }

  // Enhanced bookmark prioritization with intelligent placement
  if (prioritizeBookmarked) {
    const bookmarkedWordIds = await WordProgress.find({
      user_id: userId,
      is_bookmarked: true, // Bookmarks are cross-session
    }).distinct('word_id');

    // Separate bookmarked and non-bookmarked words
    const bookmarkedWords = filteredWordIds.filter((wordId) =>
      bookmarkedWordIds.some((bookmarkedId) => bookmarkedId.equals(wordId))
    );
    const nonBookmarkedWords = filteredWordIds.filter(
      (wordId) => !bookmarkedWordIds.some((bookmarkedId) => bookmarkedId.equals(wordId))
    );

    // Shuffle both arrays independently for variety
    const shuffledBookmarks = (this as UserProgressModel).shuffleArray(bookmarkedWords);
    const shuffledNonBookmarks = (this as UserProgressModel).shuffleArray(nonBookmarkedWords);

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
    const bookmarksPerSlot = Math.max(1, Math.floor(priorityBookmarks.length / 3));

    let bookmarkIndex = 0;
    let nonBookmarkIndex = 0;

    // Fill priority zone with weighted distribution (2 bookmarks : 1 regular)
    while (priorityZone.length < bookmarkZoneSize && (bookmarkIndex < priorityBookmarks.length || nonBookmarkIndex < shuffledNonBookmarks.length)) {
      // Add bookmarks (2 at a time if available)
      for (let i = 0; i < 2 && bookmarkIndex < priorityBookmarks.length && priorityZone.length < bookmarkZoneSize; i++) {
        priorityZone.push(priorityBookmarks[bookmarkIndex++]);
      }

      // Add 1 non-bookmark for variety
      if (nonBookmarkIndex < shuffledNonBookmarks.length && priorityZone.length < bookmarkZoneSize) {
        priorityZone.push(shuffledNonBookmarks[nonBookmarkIndex++]);
      }
    }

    // Combine remaining words for the rest of the deck
    const remainingZone = [
      ...remainingBookmarks,
      ...shuffledNonBookmarks.slice(nonBookmarkIndex),
    ];

    // Final deck: priority zone + remaining zone
    filteredWordIds = [...priorityZone, ...(this as UserProgressModel).shuffleArray(remainingZone)];
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
userProgressSchema.statics.shuffleArray = function <T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

userProgressSchema.statics.getNextSlidingWindow = async function (
  currentSteps: StepRange,
  level: LearningLevel
): Promise<StepRange | null> {
  // Import Word model dynamically
  const Word = mongoose.model('Word');
  const maxStepResult = await Word.aggregate([
    { $match: { level: level } },
    { $group: { _id: null, maxStep: { $max: '$step' } } },
  ]);

  const maxStep = maxStepResult.length > 0 ? maxStepResult[0].maxStep : 10;

  // Use SlidingWindowService for getting next window
  return await SlidingWindowService.getNextWindow(currentSteps, level);
};

userProgressSchema.statics.getUserLearningStats = async function (userId: mongoose.Types.ObjectId): Promise<any> {
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

// Checkpoint management methods
userProgressSchema.statics.saveCheckpoint = async function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<boolean> {
  try {
    const progress = await UserProgress.findByUserAndType(userId, progressType);
    if (!progress) return false;

    const deckWindow = {
      level: progress.current_level,
      steps: progress.steps,
      wordIds: progress.shuffled_order,
      windowIndex: 0, // Would be calculated from SlidingWindowService
      isCircular: SlidingWindowService.isCircularWindow(progress.steps),
      totalWindows: SlidingWindowService.generateAllWindows(progress.current_level).length,
    };

    await CheckpointService.saveCheckpoint(
      userId,
      progressType,
      deckWindow,
      progress.current_index,
      progress.shuffled_order
    );

    return true;
  } catch (error) {
    console.error('Failed to save checkpoint:', error);
    return false;
  }
};

userProgressSchema.statics.restoreFromCheckpoint = async function (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  checkpointId?: string
): Promise<UserProgressDocument | null> {
  try {
    const restoreResult = await CheckpointService.restoreCheckpoint(userId, progressType, checkpointId);

    if (!restoreResult.success || !restoreResult.checkpoint) {
      throw new Error(restoreResult.message);
    }

    // Restore progress from checkpoint
    const restoredProgress = await CheckpointService.restoreProgressFromCheckpoint(restoreResult.checkpoint, this);

    return restoredProgress;
  } catch (error) {
    console.error('Failed to restore from checkpoint:', error);
    return null;
  }
};

// Enhanced sliding window methods using SlidingWindowService
userProgressSchema.statics.getAvailableWindows = async function (level: LearningLevel): Promise<StepRange[]> {
  return await SlidingWindowService.getAvailableWindows(level);
};

userProgressSchema.statics.getWindowStatistics = function (level: LearningLevel): any {
  return SlidingWindowService.getWindowStatistics(level);
};

userProgressSchema.statics.generateWindowTransitionMap = function (level: LearningLevel): any {
  return SlidingWindowService.generateWindowTransitionMap(level);
};

// Create and export model
const UserProgress = mongoose.model<UserProgressDocument, UserProgressModel>(
  'UserProgress',
  userProgressSchema,
  'user_progress'
);

export default UserProgress;
