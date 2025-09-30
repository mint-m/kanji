import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';

// Learning levels
export type LearningLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Parts of speech types
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'particle'
  | 'conjunction'
  | 'pronoun'
  | 'interjection'
  | 'prefix'
  | 'suffix';

// Step range for queries
export interface StepRange {
  min: number;
  max: number;
}

// Word statistics for analytics
export interface WordLevelStats {
  level: LearningLevel;
  totalWords: number;
  minStep: number;
  maxStep: number;
  stepsCount: number;
  averageWordsPerStep: number;
}

// Word search filters
export interface WordSearchFilters {
  level?: LearningLevel;
  step?: number;
  stepRange?: { start: number; end: number };
  searchTerm?: string; // Search in entry, pron, or meanings
  partsOfSpeech?: string[];
  hasKanji?: boolean; // Whether pron field is not empty
}

// Word document interface
export interface WordDocument extends Document {
  origin_entry_id: string;
  entry: string; // Hiragana reading
  pron?: string; // Kanji form (optional)
  level: LearningLevel;
  step: number; // Step within level (1-10)
  means: string[]; // Korean meanings array
  parts: string[]; // Parts of speech array
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  hasKanji(): boolean;
  getPrimaryMeaning(): string;
  getDisplayForm(): string; // Returns kanji if available, otherwise hiragana
  isInStepRange(start: number, end: number): boolean;
  getDifficultyScore(): number; // Based on step position
  getSearchableText(): string; // Combined searchable content
}

// Word model interface with static methods
export interface WordModel extends Model<WordDocument> {
  // Sliding window queries
  getWordsInStepRange(level: LearningLevel, startStep: number, endStep: number): Promise<WordDocument[]>;

  getWordsByLevel(level: LearningLevel): Promise<WordDocument[]>;

  getWordsByStep(level: LearningLevel, step: number): Promise<WordDocument[]>;

  // Analytics and statistics
  getStepRange(level: LearningLevel): Promise<StepRange[]>;

  getLevelStats(level?: LearningLevel): Promise<WordLevelStats[]>;

  getWordsPerStep(level: LearningLevel): Promise<{ step: number; count: number }[]>;

  // Search functionality
  searchWords(filters: WordSearchFilters, limit?: number): Promise<WordDocument[]>;

  searchByText(searchTerm: string, level?: LearningLevel, limit?: number): Promise<WordDocument[]>;

  // Random selection
  getRandomWords(
    level?: LearningLevel,
    count?: number,
    stepRange?: { start: number; end: number }
  ): Promise<WordDocument[]>;

  // Validation and utilities
  validateStepRange(level: LearningLevel, start: number, end: number): Promise<boolean>;

  getNextAvailableStep(level: LearningLevel): Promise<number>;

  rebalanceSteps(level: LearningLevel): Promise<{ moved: number; errors: any[] }>;

  // Bulk operations
  bulkUpdateSteps(
    updates: { wordId: mongoose.Types.ObjectId; newStep: number }[]
  ): Promise<{ modified: number; errors: any[] }>;

  // Import/Export utilities
  importWords(words: Partial<WordDocument>[]): Promise<{ created: number; errors: any[] }>;

  exportWords(level?: LearningLevel, format?: 'json' | 'csv'): Promise<WordDocument[] | string>;

  // Maintenance operations
  findDuplicateEntries(): Promise<{ entry: string; count: number; ids: mongoose.Types.ObjectId[] }[]>;

  cleanupInvalidWords(): Promise<{ removed: number; errors: any[] }>;

  updateLevelStepDistribution(level: LearningLevel): Promise<void>;
}

export default WordModel;
