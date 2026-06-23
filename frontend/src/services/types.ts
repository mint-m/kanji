/**
 * API 공통 타입 정의
 */

// 학습 레벨
export type LearningLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// 진행 타입 (Main/Sub 세션)
export type ProgressType = 'main' | 'sub';

// 스텝 범위
export interface StepRange {
  start: number;
  end: number;
}

// 단어 데이터
export interface Word {
  _id: string;
  origin_entry_id: string;
  entry: string; // 히라가나 읽기
  pron?: string; // 한자 표기
  level: LearningLevel;
  step: number;
  means: string[]; // 한국어 뜻
  parts: string[]; // 품사
}

export interface UserProgress {
  _id: string;
  user_id: string;
  progress_type: ProgressType;
  current_level: LearningLevel;
  steps: StepRange;
  shuffled_order: string[]; // Word ID 배열
  current_index: number;
  created_at: string;
  updated_at: string;
}

// 단어 진행 상황 (WordProgress)
export interface WordProgress {
  _id: string;
  user_id: string;
  word_id: string;
  progress_type: ProgressType;
  is_window_completed: boolean;
  is_bookmarked: boolean;
  try_count: number;
  correct_count: number;
  time_spent_total: number;
  study_streak: number;
  last_studied_at?: string;
  created_at: string;
  updated_at: string;
}

// 세션 통계
export interface SessionStats {
  totalWords: number;
  completedWords: number;
  remainingWords: number;
  progressPercentage: number;
  averageWordsPerStep: number;
  currentStep: number;
  totalSteps: number;
}

// 덱 생성 옵션
export interface DeckGenerationOptions {
  excludeCompleted?: boolean;
  prioritizeBookmarked?: boolean;
  shuffleOrder?: boolean;
  maxWords?: number;
}

// 덱 데이터
export interface Deck {
  deckId: string;
  words: Word[];
  totalWords: number;
  level: LearningLevel;
  steps: StepRange;
  excludedCompleted: number;
  prioritizedBookmarks: number;
  options: DeckGenerationOptions;
  generatedAt: string;
  estimatedStudyTime: number; // minutes
}

// 현재 덱 데이터 (단어별 진행 상황 포함)
export interface CurrentDeck {
  deckId: string;
  level: LearningLevel;
  steps: StepRange;
  progressType: ProgressType;
  words: DeckWord[];
  currentIndex: number;
  sessionStats: SessionStats;
  deckStatus: {
    isPassComplete: boolean;
    isWindowComplete: boolean;
    canMoveToNext: boolean;
    completionPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 덱 단어 (Word + WordProgress 결합)
export interface DeckWord extends Word {
  index: number;
  isCurrent: boolean;
  isWindowCompleted: boolean;
  isBookmarked: boolean;
  studyStats?: {
    tryCount: number;
    correctCount: number;
    successRate: number;
    timeSpent: number;
  };
  recommendedAction?: 'continue' | 'review' | 'intensive_practice' | 'skip';
}

// 단어 완료 요청
export interface CompleteWordRequest {
  wordId: string;
  isCorrect: boolean;
  timeSpent?: number;
}

// 단어 완료 응답
export interface CompleteWordResponse {
  completion: {
    wordId: string;
    isCorrect: boolean;
    timeSpent?: number;
    previousAttempts: number;
    newMasteryLevel?: string;
    shouldRepeat: boolean;
  };
  wordProgress: {
    totalAttempts: number;
    successRate: number;
    studyStreak: number;
    masteryLevel: string;
    recommendedAction: string;
    isBookmarked: boolean;
  };
  currentIndex: number;
  passComplete: boolean;
  windowComplete: boolean;
  nextPassSize?: number;
}

// API 응답 래퍼
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
