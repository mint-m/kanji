/**
 * API 공통 타입 정의
 */

// 학습 레벨
export type LearningLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'daily';

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

// 윈도우(범위) 전체 기준 진행 — 패스와 달리 다시 섞어도 줄지 않는다
export interface WindowProgress {
  total: number;
  known: number;
}

// 세션 카드용 요약 (GET /progress)
export interface SessionSummary {
  type: ProgressType;
  level: LearningLevel;
  steps: StepRange;
  sessionStats: SessionStats;
  window: WindowProgress;
  isPassCompleted: boolean;
  updatedAt: string;
}

// 학습 기록 (GET /me/stats) — 익힌 단어 = 복습에 등록된 단어, 장기 기억 = 14일 간격 이상
// 학습 설정 — 학습 카드를 누를 때 먼저 보일 것은 요미가나(reading) 또는 뜻(meaning)
export type RevealFirst = 'reading' | 'meaning';

export interface Preferences {
  dailyGoal: number;
  revealFirst: RevealFirst;
}

export interface UserStats {
  learned: { total: number; longTerm: number };
  levels: { level: LearningLevel; total: number; learned: number; longTerm: number }[];
  review: { due: number; nextDueAt: string | null };
  streak: { current: number; longest: number; studyDays: number };
  today: { date: string; count: number; goal: number }; // date: 한국 시간 'YYYY-MM-DD'
  activity: { date: string; count: number }[]; // 학습 잔디 — 최근 16주 중 답한 날만
  totalAnswers: number;
}

// 세션 통계 (현재 패스 기준)
export interface SessionStats {
  totalWords: number;
  completedWords: number;
  remainingWords: number;
  progressPercentage: number;
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
  window: WindowProgress;
  deckStatus: {
    isPassComplete: boolean;
    isWindowComplete: boolean;
    canMoveToNext: boolean;
    completionPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 덱 단어 (Word + 단어별 진행 상태)
export interface DeckWord extends Word {
  index: number;
  isCurrent: boolean;
  isWindowCompleted: boolean;
  isBookmarked: boolean;
}

// 오늘의 복습 단어 (GET /reviews/due)
export interface ReviewWord extends Word {
  stage: number; // 0 = 다시 익히는 중, 1~6 = 간격 단계
  isBookmarked: boolean;
}

export interface DueReviews {
  words: ReviewWord[];
  dueCount: number;
  nextDueAt: string | null;
}

// 단어 완료 요청
export interface CompleteWordRequest {
  wordId: string;
  isCorrect: boolean;
  timeSpent?: number;
  index?: number; // 답한 카드의 덱 내 위치 — 서버 위치와 다르면 409(PROGRESS_OUT_OF_SYNC)
}

// 단어 완료 응답
export interface CompleteWordResponse {
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
  code?: string;
  warning?: { remaining: number };
}
