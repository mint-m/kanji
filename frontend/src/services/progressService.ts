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
    main: any | null;
    sub: any | null;
  };
  overall: {
    totalSessions: number;
    totalWordsInDecks: number;
    averageProgress: number;
  };
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
    return api.get(`/api/progress/${type}`);
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
    return api.put(`/api/progress/${type}/index`, data);
  },

  /**
   * 세션 리셋 (처음부터 다시 시작)
   */
  async resetSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.put(`/api/progress/${type}/reset`);
  },

  /**
   * 다음 슬라이딩 윈도우 생성
   *
   * 현재 윈도우가 완료되었을 때 다음 윈도우로 이동
   * 예: 1-3 → 2-4
   */
  async generateNextWindow(type: ProgressType): Promise<ApiResponse<any>> {
    return api.post(`/api/progress/${type}/next-window`);
  },

  /**
   * 세션 삭제
   */
  async deleteSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.delete(`/api/progress/${type}`);
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
};

export default progressService;
