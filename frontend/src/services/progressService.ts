/**
 * Progress Service
 *
 * 사용자 학습 진행 상황(UserProgress) 관리 API
 * - 세션 생성/조회/삭제
 * - 현재 단어 인덱스 이동
 * - 다음 윈도우 생성
 * - 학습 통계 조회
 */

import { api } from './apiClient';
import {
  ApiResponse,
  CompleteWordRequest,
  CompleteWordResponse,
  LearningLevel,
  ProgressType,
  StepRange,
  UserProgress,
  SessionStats,
} from './types';

// 세션 생성 요청 데이터
export interface CreateSessionRequest {
  type: ProgressType;
  level: LearningLevel;
  steps: StepRange;
}

// 세션 생성 응답 데이터
export interface CreateSessionResponse {
  session: UserProgress;
  sessionStats: SessionStats;
  deckSize: number;
}

// 진행 상황 조회 응답
export interface GetProgressResponse {
  progress: UserProgress;
  sessionStats: SessionStats;
  currentWord: string | null;
  remainingWords: number;
  canMoveToNextWindow: boolean;
  restoredFromCheckpoint?: boolean;
}

// 인덱스 업데이트 요청
export interface UpdateIndexRequest {
  action: 'next' | 'previous' | 'jump';
  index?: number;
}

// 학습 통계 응답
export interface LearningStatsResponse {
  sessionStats: Array<{
    _id: ProgressType;
    sessions: number;
    totalWords: number;
    completedWords: number;
    levels: LearningLevel[];
    avgProgress: number;
  }>;
  wordStats: {
    main: WordStatsSummary | null;
    sub: WordStatsSummary | null;
  };
  overall: {
    totalSessions: number;
    totalWordsInDecks: number;
    averageProgress: number;
  };
}

// 단어 학습 통계 집계 결과
export interface WordStatsSummary {
  _id: null;
  total_words: number;
  completed_words: number;
  bookmarked_words: number;
  total_tries: number;
  total_correct: number;
  avg_tries: number;
  avg_success_rate: number;
  total_time_spent: number;
}

// 레벨 단계 데이터
export interface LevelStepData {
  level: string;
  totalWords: number;
  totalSteps: number;
  stepRange: { min: number; max: number };
  availableSteps: number[];
}

// 체크포인트 업데이트 응답
export interface CheckpointUpdateData {
  progress_type: ProgressType;
  current_level: LearningLevel;
  steps: StepRange;
  current_index: number;
  updated_at: string;
}

const progressService = {
  /**
   * 모든 활성 세션 조회
   */
  async getAllSessions(): Promise<ApiResponse<{ sessions: any[]; totalSessions: number }>> {
    return api.get('/api/users/me/progress');
  },

  /**
   * 특정 타입의 세션 조회 (main/sub)
   *
   * - 활성 세션이 없으면 체크포인트에서 자동 복원 시도
   * - 복원 성공 시 restoredFromCheckpoint: true
   */
  async getUserProgress(type: ProgressType): Promise<ApiResponse<GetProgressResponse>> {
    return api.get(`/api/users/me/progress/${type}`);
  },

  /**
   * 새 학습 세션 생성
   *
   * @param data - 세션 생성 정보 (type, level, steps)
   * @returns 생성된 세션 정보
   *
   * 예시:
   * ```
   * await progressService.createSession({
   *   type: 'main',
   *   level: 'N5',
   *   steps: { start: 1, end: 3 }
   * });
   * ```
   */
  async createSession(data: CreateSessionRequest): Promise<ApiResponse<CreateSessionResponse>> {
    return api.post('/api/users/me/progress', data);
  },

  /**
   * 현재 단어 인덱스 이동
   *
   * @param type - 세션 타입 (main/sub)
   * @param data - 이동 방향 (next/previous/jump)
   */
  async updateWordIndex(type: ProgressType, data: UpdateIndexRequest): Promise<ApiResponse<any>> {
    return api.put(`/api/users/me/progress/${type}/index`, data);
  },

  /**
   * 세션 리셋 (처음부터 다시 시작)
   */
  async resetSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.put(`/api/users/me/progress/${type}/reset`);
  },

  /**
   * 세션 삭제
   */
  async deleteSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.delete(`/api/users/me/progress/${type}`);
  },

  /**
   * Main/Sub 세션 전환
   */
  async switchSessionType(fromType: ProgressType, toType: ProgressType): Promise<ApiResponse<any>> {
    return api.post('/api/users/me/progress/switch', { fromType, toType });
  },

  /**
   * 학습 통계 조회
   */
  async getLearningStats(): Promise<ApiResponse<LearningStatsResponse>> {
    return api.get('/api/users/me/progress/stats');
  },

  /**
   * 단어 완료 처리
   *
   * @param progressType - 진행 타입 (main/sub)
   * @param data - 완료 정보 (wordId, isCorrect, timeSpent)
   */
  async completeWord(
    progressType: ProgressType,
    data: CompleteWordRequest
  ): Promise<ApiResponse<CompleteWordResponse>> {
    return api.post(`/api/users/me/progress/${progressType}/complete-word`, data);
  },

  /**
   * 레벨 단계 데이터 조회
   *
   * @param progressType - 진행 타입 (main/sub)
   * @param level - 학습 레벨
   */
  async getLevelStepData(
    progressType: ProgressType,
    level: string
  ): Promise<ApiResponse<LevelStepData>> {
    return api.get(`/api/users/me/progress/${progressType}/levels/${level}`);
  },

  /**
   * 체크포인트 저장 (레벨/파트 선택 시)
   *
   * @param progressType - 진행 타입 (main/sub)
   * @param level - 선택한 레벨
   * @param steps - 선택한 스텝 범위
   */
  async saveCheckpoint(
    progressType: ProgressType,
    level: LearningLevel,
    steps: StepRange
  ): Promise<ApiResponse<CheckpointUpdateData>> {
    return api.patch(`/api/users/me/checkpoint`, { progressType, level, steps });
  },

};

export default progressService;
