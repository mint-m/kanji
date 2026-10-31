import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { UserAuthType, Theme, Language } from '../types/common';

export type RevealFirst = 'reading' | 'meaning';

// User preferences interface
export interface UserPreferences {
  studyReminders: boolean;
  reminderTime?: string; // HH:MM format
  dailyGoal: number; // words per day
  revealFirst: RevealFirst; // 학습 카드를 누를 때 먼저 보일 것
  theme: Theme;
  language: Language;
  soundEffects: boolean;
  autoPlayAudio: boolean;
}

// User statistics interface
export interface UserStats {
  totalWordsStudied: number;
  totalTimeSpent: number; // milliseconds
  currentStreak: number;
  longestStreak: number;
  averageSessionTime: number;
  studyDaysCount: number;
  favoriteStudyTime?: string; // Most common study hour
  lastStudyDate?: string; // 마지막으로 학습한 날 (한국 시간 'YYYY-MM-DD')
  todayCount: number; // lastStudyDate 하루 동안의 응답 수
}

// User profile interface
export interface UserProfile {
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  studyGoals?: string[];
  joinedAt: Date;
  lastActiveAt?: Date;
  timezone?: string;
}

// Auth provider entry for multi-provider accounts
export interface AuthProvider {
  provider: UserAuthType;
  providerId: string;
}

// User document interface
export interface UserDocument extends Document {
  type: UserAuthType;
  email: string;
  name: string;
  authProviders: AuthProvider[];
  activeProgressType: 'main' | 'sub' | null; // Active learning session type
  preferences: UserPreferences;
  profile: UserProfile;
  statistics: UserStats;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  getDisplayName(): string;
  updateLastActive(): void;
  recordStudy(timeSpent: number): void;
  getCurrentStreak(now?: Date): number;
  getTodayCount(now?: Date): number;
  getStudyLevel(): 'beginner' | 'intermediate' | 'advanced';
  canReceiveReminders(): boolean;
  isNewUser(): boolean;
  getDaysSinceJoined(): number;
}

// User model interface with static methods
export interface UserModel extends Model<UserDocument> {
  // Authentication methods
  findByEmail(email: string): Promise<UserDocument | null>;

  findOrCreateFromOAuth(authData: {
    type: UserAuthType;
    providerId: string;
    email: string;
    name: string;
    profilePicture?: string;
  }): Promise<UserDocument>;
}

export default UserModel;
