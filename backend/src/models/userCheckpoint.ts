import mongoose from 'mongoose';
import { ProgressType, LearningLevel, LEARNING_LEVELS, StepRange, SessionStats } from '../types/common';
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

// 클라이언트가 답한 위치가 서버 진행 위치와 같은지 — 재시도·중복 요청이 다른 단어를 기록하지 않도록
userCheckpointSchema.methods.isAtWord = function (
  this: UserCheckpointDocument,
  index: number,
  wordId: mongoose.Types.ObjectId
): boolean {
  return index === this.current_index && !!this.getCurrentWord()?.equals(wordId);
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

  // Reset window completion state for all words in this new session
  await wordProgressModel().resetWindowCompletionForWords(userId, deckWindow.wordIds, type);

  // Create new session
  const session = new this({
    user_id: userId,
    progress_type: type,
    current_level: level,
    steps,
    shuffled_order: deckWindow.wordIds,
    current_index: 0,
  });

  return await session.save();
};

// Create and export model
const UserCheckpoint = mongoose.model<UserCheckpointDocument, UserCheckpointModel>(
  'UserCheckpoint',
  userCheckpointSchema,
  'user_checkpoints'
);

export default UserCheckpoint;
