import mongoose from 'mongoose';
import {
  UserDocument,
  UserModel,
  UserAuthType,
  UserPreferences,
  UserProfile,
  UserStats,
  AuthProvider,
} from '../interfaces/user';

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
      dailyGoal: { type: Number, default: 20, min: 1, max: 100 },
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
      levelsCompleted: [{ type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'] }],
      averageSessionTime: { type: Number, default: 0, min: 0 },
      studyDaysCount: { type: Number, default: 0, min: 0 },
      favoriteStudyTime: { type: String },
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

UserSchema.methods.incrementStreak = function (this: UserDocument): void {
  this.statistics.currentStreak++;
  if (this.statistics.currentStreak > this.statistics.longestStreak) {
    this.statistics.longestStreak = this.statistics.currentStreak;
  }
};

UserSchema.methods.resetStreak = function (this: UserDocument): void {
  this.statistics.currentStreak = 0;
};

UserSchema.methods.updateStudyStats = function (this: UserDocument, timeSpent: number, wordsStudied: number): void {
  this.statistics.totalTimeSpent += timeSpent;
  this.statistics.totalWordsStudied += wordsStudied;
  this.statistics.studyDaysCount++;

  // Update average session time
  this.statistics.averageSessionTime = this.statistics.totalTimeSpent / this.statistics.studyDaysCount;

  this.updateLastActive();
};

UserSchema.methods.getStudyLevel = function (this: UserDocument): 'beginner' | 'intermediate' | 'advanced' {
  const wordsStudied = this.statistics.totalWordsStudied;

  if (wordsStudied >= 1000) return 'advanced';
  if (wordsStudied >= 200) return 'intermediate';
  return 'beginner';
};

UserSchema.methods.getPreferredStudyTime = function (this: UserDocument): string | null {
  return this.statistics.favoriteStudyTime || this.preferences.reminderTime || null;
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

UserSchema.statics.deactivateUser = async function (userId: mongoose.Types.ObjectId): Promise<boolean> {
  const result = await this.updateOne({ _id: userId }, { isActive: false });
  return result.modifiedCount > 0;
};

UserSchema.statics.reactivateUser = async function (userId: mongoose.Types.ObjectId): Promise<boolean> {
  const result = await this.updateOne(
    { _id: userId },
    {
      isActive: true,
      'profile.lastActiveAt': new Date(),
    },
  );
  return result.modifiedCount > 0;
};

UserSchema.statics.updatePreferences = function (
  userId: mongoose.Types.ObjectId,
  preferences: Partial<UserPreferences>,
): Promise<UserDocument | null> {
  return this.findByIdAndUpdate(
    userId,
    {
      $set: Object.keys(preferences).reduce((acc, key) => {
        acc[`preferences.${key}`] = preferences[key as keyof UserPreferences];
        return acc;
      }, {} as any),
    },
    { new: true },
  );
};

UserSchema.statics.updateProfile = function (
  userId: mongoose.Types.ObjectId,
  profile: Partial<UserProfile>,
): Promise<UserDocument | null> {
  return this.findByIdAndUpdate(
    userId,
    {
      $set: Object.keys(profile).reduce((acc, key) => {
        acc[`profile.${key}`] = profile[key as keyof UserProfile];
        return acc;
      }, {} as any),
    },
    { new: true },
  );
};

UserSchema.statics.getActiveUsers = function (days: number = 30): Promise<UserDocument[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    isActive: true,
    'profile.lastActiveAt': { $gte: cutoffDate },
  });
};

UserSchema.statics.getUserStats = async function (userId: mongoose.Types.ObjectId): Promise<UserStats | null> {
  const user = await this.findById(userId);
  return user ? user.statistics : null;
};

UserSchema.statics.getTopUsers = function (
  metric: 'streak' | 'wordsStudied' | 'timeSpent',
  limit: number = 10,
): Promise<UserDocument[]> {
  const sortField = {
    streak: 'statistics.currentStreak',
    wordsStudied: 'statistics.totalWordsStudied',
    timeSpent: 'statistics.totalTimeSpent',
  }[metric];

  return this.find({ isActive: true })
    .sort({ [sortField]: -1 })
    .limit(limit);
};

UserSchema.statics.getUsersByStudyLevel = function (
  level: 'beginner' | 'intermediate' | 'advanced',
): Promise<UserDocument[]> {
  let wordsRange: { $gte?: number; $lt?: number } = {};

  switch (level) {
    case 'beginner':
      wordsRange = { $lt: 200 };
      break;
    case 'intermediate':
      wordsRange = { $gte: 200, $lt: 1000 };
      break;
    case 'advanced':
      wordsRange = { $gte: 1000 };
      break;
  }

  return this.find({
    isActive: true,
    'statistics.totalWordsStudied': wordsRange,
  });
};

UserSchema.statics.cleanupInactiveUsers = async function (
  daysSinceLastActive: number,
): Promise<{ deactivated: number; errors: any[] }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActive);

  const errors: any[] = [];
  let deactivated = 0;

  try {
    const result = await this.updateMany(
      {
        isActive: true,
        $or: [
          { 'profile.lastActiveAt': { $lt: cutoffDate } },
          { 'profile.lastActiveAt': { $exists: false }, createdAt: { $lt: cutoffDate } },
        ],
      },
      { isActive: false },
    );
    deactivated = result.modifiedCount || 0;
  } catch (error) {
    errors.push(error);
  }

  return { deactivated, errors };
};

UserSchema.statics.updateUserStatistics = async function (userId: mongoose.Types.ObjectId): Promise<void> {
  // This would typically aggregate data from WordProgress and UserProgress collections
  // Implementation depends on the specific analytics requirements
  const WordProgress = mongoose.model('WordProgress');

  const stats = await WordProgress.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: null,
        totalWords: { $sum: 1 },
        totalTime: { $sum: '$time_spent_total' },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.updateOne(
      { _id: userId },
      {
        $set: {
          'statistics.totalWordsStudied': stats[0].totalWords,
          'statistics.totalTimeSpent': stats[0].totalTime,
        },
      },
    );
  }
};

UserSchema.statics.sendStudyReminders = async function (this): Promise<{ sent: number; errors: any[] }> {
  const errors: any[] = [];
  let sent = 0;

  // Get users eligible for reminders
  const users = await this.find({
    'preferences.studyReminders': true,
    emailVerified: true,
    isActive: true,
  });

  // Implementation would depend on email service integration
  // For now, just return the count of eligible users
  sent = users.length;

  return { sent, errors };
};

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema, 'user');

export default User;
