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

  // Import Word model dynamically to avoid circular dependency
  const Word = mongoose.model('Word');
  const maxStepResult = await Word.aggregate([
    { $match: { level: this.current_level } },
    { $group: { _id: null, maxStep: { $max: '$step' } } },
  ]);

  const maxStep = maxStepResult.length > 0 ? maxStepResult[0].maxStep : 10;
  return this.steps.end < maxStep;
};

userProgressSchema.methods.generateNextSlidingWindow = async function (this: UserProgressDocument): Promise<void> {
  const canMove = await this.canMoveToNextWindow();
  if (!canMove) return;

  // Calculate next sliding window (shift by 1 step)
  const nextSteps: StepRange = {
    start: this.steps.start + 1,
    end: this.steps.end + 1,
  };

  // Generate new deck
  const UserProgressModel = mongoose.model<UserProgressDocument, UserProgressModel>('UserProgress');
  const newDeck = await UserProgressModel.generateSlidingWindowDeck(this.current_level, nextSteps, this.user_id, {
    excludeCompleted: true,
    shuffleOrder: true,
  });

  // Update current session
  this.steps = nextSteps;
  this.shuffled_order = newDeck;
  this.current_index = 0;
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
  // Generate initial deck
  const shuffledOrder = await (this as UserProgressModel).generateSlidingWindowDeck(level, steps, userId, {
    excludeCompleted: true,
    shuffleOrder: true,
  });

  // Create new session
  const session = new this({
    user_id: userId,
    progress_type: type,
    current_level: level,
    steps,
    shuffled_order: shuffledOrder,
    current_index: 0,
  });

  return await session.save();
};

userProgressSchema.statics.generateSlidingWindowDeck = async function (
  level: LearningLevel,
  steps: StepRange,
  userId: mongoose.Types.ObjectId,
  options: DeckGenerationOptions = {}
): Promise<mongoose.Types.ObjectId[]> {
  const { excludeCompleted = true, prioritizeBookmarked = false, shuffleOrder = true, maxWords } = options;

  // Import models dynamically to avoid circular dependency
  const Word = mongoose.model('Word');
  const WordProgress = mongoose.model('WordProgress');

  // Get words in step range
  let wordIds = await Word.find({
    level: level,
    step: { $gte: steps.start, $lte: steps.end },
  }).select('_id');

  // Filter out completed words if requested
  if (excludeCompleted) {
    const completedWordIds = await WordProgress.find({
      user_id: userId,
      progress_type: 'main', // Use main progress for filtering
      is_completed: true,
    }).distinct('word_id');

    wordIds = wordIds.filter((word) => !completedWordIds.some((completedId) => completedId.equals(word._id)));
  }

  // Prioritize bookmarked words if requested
  if (prioritizeBookmarked) {
    const bookmarkedWordIds = await WordProgress.find({
      user_id: userId,
      is_bookmarked: true,
    }).distinct('word_id');

    const bookmarkedWords = wordIds.filter((word) =>
      bookmarkedWordIds.some((bookmarkedId) => bookmarkedId.equals(word._id))
    );
    const nonBookmarkedWords = wordIds.filter(
      (word) => !bookmarkedWordIds.some((bookmarkedId) => bookmarkedId.equals(word._id))
    );

    wordIds = [...bookmarkedWords, ...nonBookmarkedWords];
  }

  // Limit words if maxWords is specified
  if (maxWords && wordIds.length > maxWords) {
    wordIds = wordIds.slice(0, maxWords);
  }

  // Shuffle order if requested
  if (shuffleOrder) {
    wordIds.sort(() => Math.random() - 0.5);
  }

  return wordIds.map((word) => word._id);
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

  // Calculate next sliding window
  const nextStart = currentSteps.start + 1;
  const nextEnd = currentSteps.end + 1;

  // Check if next window is within bounds
  if (nextStart > maxStep) return null;

  return {
    start: nextStart,
    end: Math.min(nextEnd, maxStep),
  };
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

// Create and export model
const UserProgress = mongoose.model<UserProgressDocument, UserProgressModel>(
  'UserProgress',
  userProgressSchema,
  'user_progress'
);

export default UserProgress;
