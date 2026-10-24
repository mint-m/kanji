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

// 윈도우의 단어 전체를 섞어 새 덱을 만들고 그 단어들의 윈도우 완료 표시를 지운다 — 새 윈도우는 모두 '모름'에서 시작한다
const buildFreshDeck = async (
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType,
  level: LearningLevel,
  steps: StepRange
): Promise<mongoose.Types.ObjectId[]> => {
  const { wordIds } = await SlidingWindowService.generateDeck(level, steps, true);
  await wordProgressModel().resetWindowCompletionForWords(userId, wordIds, progressType);
  return wordIds;
};

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

// 사용자당 세션 타입별로 하나 — 동시 생성 요청이 중복 세션을 만들지 못하게 한다
userCheckpointSchema.index({ user_id: 1, progress_type: 1 }, { unique: true });

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

// 현재 패스 기준 진행 — 순환 윈도우(9-1)는 start > end라 스텝 수로 나누는 계산을 두지 않는다
userCheckpointSchema.methods.getSessionStats = function (this: UserCheckpointDocument): SessionStats {
  const totalWords = this.shuffled_order.length;
  const completedWords = Math.min(this.current_index, totalWords);

  return {
    totalWords,
    completedWords,
    remainingWords: totalWords - completedWords,
    progressPercentage: totalWords > 0 ? (completedWords / totalWords) * 100 : 0,
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

  // 겹치는 스텝의 단어는 이전 윈도우에서 '알았음'으로 남아 있으므로 새 덱 기준으로 리셋한다
  this.shuffled_order = await buildFreshDeck(userId, progressType, this.current_level, nextWindow);
  this.steps = nextWindow;
  this.current_index = 0;
};

// 같은 윈도우를 처음부터 다시 — 서브 세션 집중 루프. 마지막 패스의 단어만 섞으면 루프가 점점 줄어든다
userCheckpointSchema.methods.restartWindow = async function (
  this: UserCheckpointDocument,
  userId: mongoose.Types.ObjectId,
  progressType: ProgressType
): Promise<void> {
  this.shuffled_order = await buildFreshDeck(userId, progressType, this.current_level, this.steps);
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

  const session = new this({
    user_id: userId,
    progress_type: type,
    current_level: level,
    steps,
    shuffled_order: await buildFreshDeck(userId, type, level, steps),
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
