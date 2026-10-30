import mongoose from 'mongoose';
import { UserAuthType } from '../types/common';
import {
  UserDocument,
  UserModel,
  AuthProvider,
} from '../interfaces/user';
import { ConflictError } from '../utils/errors';
import { toKstDate, daysBetween } from '../utils/date';

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    type: {
      type: String,

      required: true,
      enum: ['google', 'kakao', 'local'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    authProviders: [
      {
        provider: { type: String, enum: ['google', 'kakao', 'local'], required: true },
        providerId: { type: String, required: true },
      },
    ],
    activeProgressType: {
      type: String,
      enum: ['main', 'sub', null],
      default: null,
    },
    preferences: {
      studyReminders: { type: Boolean, default: true },
      reminderTime: { type: String, default: '19:00' },
      dailyGoal: { type: Number, default: 30, min: 1, max: 100 },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      language: { type: String, enum: ['ko', 'en', 'ja'], default: 'ko' },
      soundEffects: { type: Boolean, default: true },
      autoPlayAudio: { type: Boolean, default: false },
    },
    profile: {
      displayName: { type: String, trim: true },
      profilePicture: { type: String },
      bio: { type: String, maxlength: 500 },
      studyGoals: [{ type: String }],
      joinedAt: { type: Date, default: Date.now },
      lastActiveAt: { type: Date },
      timezone: { type: String },
    },
    statistics: {
      totalWordsStudied: { type: Number, default: 0, min: 0 },
      totalTimeSpent: { type: Number, default: 0, min: 0 },
      currentStreak: { type: Number, default: 0, min: 0 },
      longestStreak: { type: Number, default: 0, min: 0 },
      averageSessionTime: { type: Number, default: 0, min: 0 },
      studyDaysCount: { type: Number, default: 0, min: 0 },
      favoriteStudyTime: { type: String },
      lastStudyDate: { type: String }, // 마지막으로 학습한 날 (한국 시간 'YYYY-MM-DD')
      todayCount: { type: Number, default: 0, min: 0 }, // lastStudyDate 하루 동안의 응답 수
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'authProviders.provider': 1, 'authProviders.providerId': 1 }, { unique: true, sparse: true });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'profile.lastActiveAt': 1 });
UserSchema.index({ 'statistics.currentStreak': -1 });

// Instance methods
UserSchema.methods.getDisplayName = function (this: UserDocument): string {
  return this.profile.displayName || this.name;
};

UserSchema.methods.updateLastActive = function (this: UserDocument): void {
  this.profile.lastActiveAt = new Date();
};

// 단어 응답 1회를 기록한다. 연속 학습일은 실제로 학습한 날(한국 시간)만 센다 —
// 로그인·토큰 갱신도 lastActiveAt을 바꾸므로 그 값으로 판단하면 로그인한 날의 학습이 누락된다
UserSchema.methods.recordStudy = function (this: UserDocument, timeSpent: number): void {
  const stats = this.statistics;
  const today = toKstDate();
  // lastStudyDate 도입 전 사용자는 이전 방식의 기준이던 마지막 접속일을 이어받는다
  const lastStudyDate = stats.lastStudyDate ?? (this.profile.lastActiveAt && toKstDate(this.profile.lastActiveAt));

  stats.totalWordsStudied += 1;
  stats.totalTimeSpent += timeSpent;
  stats.todayCount = stats.lastStudyDate === today ? stats.todayCount + 1 : 1;
  this.profile.lastActiveAt = new Date();

  if (stats.lastStudyDate === today) return;

  const gap = lastStudyDate ? daysBetween(lastStudyDate, today) : null;
  if (gap === 0) {
    // 도입 전 사용자가 오늘 이미 접속한 경우 — 이전 방식이 오늘을 셌을 수 있으니 연속 일수는 유지한다
    stats.currentStreak = Math.max(stats.currentStreak, 1);
  } else {
    stats.currentStreak = gap === 1 ? stats.currentStreak + 1 : 1;
    stats.studyDaysCount += 1;
  }
  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  stats.lastStudyDate = today;
};

// 표시용 연속 학습일 — 어제까지 이어졌어야 살아 있다 (저장값은 다음 학습 때에야 리셋된다)
UserSchema.methods.getCurrentStreak = function (this: UserDocument, now: Date = new Date()): number {
  const stats = this.statistics;
  const last = stats.lastStudyDate ?? (this.profile.lastActiveAt && toKstDate(this.profile.lastActiveAt));
  if (!last) return 0;
  return daysBetween(last, toKstDate(now)) <= 1 ? stats.currentStreak : 0;
};

// 오늘(한국 날짜) 응답 수
UserSchema.methods.getTodayCount = function (this: UserDocument, now: Date = new Date()): number {
  return this.statistics.lastStudyDate === toKstDate(now) ? this.statistics.todayCount : 0;
};

UserSchema.methods.getStudyLevel = function (this: UserDocument): 'beginner' | 'intermediate' | 'advanced' {
  const wordsStudied = this.statistics.totalWordsStudied;

  if (wordsStudied >= 1000) return 'advanced';
  if (wordsStudied >= 200) return 'intermediate';
  return 'beginner';
};

UserSchema.methods.canReceiveReminders = function (this: UserDocument): boolean {
  return this.preferences.studyReminders && this.emailVerified && this.isActive;
};

UserSchema.methods.isNewUser = function (this: UserDocument): boolean {
  const daysSinceJoined = this.getDaysSinceJoined();
  return daysSinceJoined <= 7; // Consider users new for first week
};

UserSchema.methods.getDaysSinceJoined = function (this: UserDocument): number {
  const now = new Date();
  const joined = this.profile.joinedAt || this.createdAt;
  const diffTime = Math.abs(now.getTime() - joined.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static methods
UserSchema.statics.findByEmail = function (email: string): Promise<UserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findOrCreateFromOAuth = async function (authData: {
  type: UserAuthType;
  providerId: string;
  email: string;
  name: string;
  profilePicture?: string;
}): Promise<UserDocument> {
  const newProvider: AuthProvider = { provider: authData.type, providerId: authData.providerId };

  // 1. providerId로 기존 연동 계정 조회
  let user = await this.findOne({
    'authProviders.provider': authData.type,
    'authProviders.providerId': authData.providerId,
  });

  if (user) {
    user.updateLastActive();
    await user.save();
    return user;
  }

  // 2. 이메일로 기존 계정 조회 → 새 provider 연동
  user = await (this as UserModel).findByEmail(authData.email);

  if (user) {
    const sameProviderDifferentId = user.authProviders.some(
      (p: AuthProvider) => p.provider === newProvider.provider && p.providerId !== newProvider.providerId,
    );
    if (sameProviderDifferentId) {
      throw new ConflictError(`This account already has a different ${authData.type} account linked`);
    }
    const alreadyLinked = user.authProviders.some(
      (p: AuthProvider) => p.provider === newProvider.provider && p.providerId === newProvider.providerId,
    );
    if (!alreadyLinked) user.authProviders.push(newProvider);
    user.updateLastActive();
    await user.save();
    return user;
  }

  // 3. 신규 계정 생성 (concurrent 요청에 의한 duplicate key 에러 처리)
  try {
    user = new this({
      type: authData.type,
      email: authData.email.toLowerCase(),
      name: authData.name,
      authProviders: [newProvider],
      profile: {
        displayName: authData.name,
        profilePicture: authData.profilePicture,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
      emailVerified: true,
    });
    await user.save();
  } catch (err: any) {
    if (err.code === 11000) {
      // 동시 요청으로 이미 생성된 경우 재조회
      user = await (this as UserModel).findByEmail(authData.email);
      if (!user) throw err;
      const alreadyLinked = user.authProviders.some(
        (p: AuthProvider) => p.provider === newProvider.provider && p.providerId === newProvider.providerId,
      );
      if (!alreadyLinked) user.authProviders.push(newProvider);
      user.updateLastActive();
      await user.save();
    } else {
      throw err;
    }
  }

  return user;
};

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema, 'user');

export default User;
