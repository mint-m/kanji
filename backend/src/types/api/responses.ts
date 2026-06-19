import { LearningLevel, StepRange, DeckGenerationOptions, ObjectId } from '../common';

export interface DeckGenerationResult {
  deckId: string;
  words: any[];
  totalWords: number;
  level: LearningLevel;
  steps: StepRange;
  excludedCompleted: number;
  prioritizedBookmarks: number;
  options: DeckGenerationOptions;
  generatedAt: Date;
  estimatedStudyTime: number;
}

export interface WordCompletionResult {
  wordId: ObjectId;
  isCorrect: boolean;
  timeSpent?: number;
  previousAttempts: number;
  newMasteryLevel?: string;
  shouldRepeat: boolean;
}
