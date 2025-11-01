import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';
import { UserAuthType, LearningLevel, Theme, Language } from '../types/common';

// Re-export for backwards compatibility
export { UserAuthType, LearningLevel };

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

// User document interface
export interface UserDocument extends Document {
  type: UserAuthType;
  email: string;
  name: string;
  learningCheckpoint?: LearningCheckpoint; // Legacy field (for migration)
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
  incrementStreak(): void;
  resetStreak(): void;
  updateStudyStats(timeSpent: number, wordsStudied: number): void;
  getStudyLevel(): 'beginner' | 'intermediate' | 'advanced';
  hasLearningCheckpoint(): boolean;
  getPreferredStudyTime(): string | null;
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
    email: string;
    name: string;
    profilePicture?: string;
  }): Promise<UserDocument>;

  // User management
  deactivateUser(userId: mongoose.Types.ObjectId): Promise<boolean>;

  reactivateUser(userId: mongoose.Types.ObjectId): Promise<boolean>;

  updatePreferences(
    userId: mongoose.Types.ObjectId,
    preferences: Partial<UserPreferences>
  ): Promise<UserDocument | null>;

  updateProfile(userId: mongoose.Types.ObjectId, profile: Partial<UserProfile>): Promise<UserDocument | null>;

  // Statistics and analytics
  getUsersWithLearningCheckpoint(): Promise<UserDocument[]>;

  getActiveUsers(days?: number): Promise<UserDocument[]>;

  getUserStats(userId: mongoose.Types.ObjectId): Promise<UserStats | null>;

  getTopUsers(metric: 'streak' | 'wordsStudied' | 'timeSpent', limit?: number): Promise<UserDocument[]>;

  getUsersByStudyLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<UserDocument[]>;

  // Maintenance operations
  cleanupInactiveUsers(daysSinceLastActive: number): Promise<{ deactivated: number; errors: any[] }>;

  updateUserStatistics(userId: mongoose.Types.ObjectId): Promise<void>;

  sendStudyReminders(): Promise<{ sent: number; errors: any[] }>;

  // Migration utilities
  migrateUsersWithCheckpoints(): Promise<{ migrated: number; errors: any[] }>;

  getUsersNeedingMigration(): Promise<UserDocument[]>;
}

export default UserModel;
