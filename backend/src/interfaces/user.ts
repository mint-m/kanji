import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { UserAuthType, LearningLevel, Theme, Language } from '../types/common';

// Legacy learning checkpoint interface (for migration)
export interface LearningCheckpoint {
  level: LearningLevel;
  step: {
    start: number;
    end: number;
  };
}

// User preferences interface
export interface UserPreferences {
  studyReminders: boolean;
  reminderTime?: string; // HH:MM format
  dailyGoal: number; // words per day
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
  levelsCompleted: LearningLevel[];
  averageSessionTime: number;
  studyDaysCount: number;
  favoriteStudyTime?: string; // Most common study hour
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
  updateDailyStreak(): void;
  updateStudyStats(timeSpent: number, wordsStudied: number): void;
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
