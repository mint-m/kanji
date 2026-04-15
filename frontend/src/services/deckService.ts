/**
 * Deck Service
 *
 * 덱 전체(큰 범위) 상태 관리 API
 * - 덱 생성 (슬라이딩 윈도우)
 * - 현재 덱 조회
 * - 덱 완료 및 다음 윈도우 전환
 * - 덱 통계 조회
 */

import { api } from './apiClient';
import {
  ApiResponse,
  LearningLevel,
  ProgressType,
  StepRange,
  DeckGenerationOptions,
  Deck,
  CurrentDeck,
} from './types';

// 덱 생성 요청
export interface GenerateDeckRequest {
  level: LearningLevel;
  steps: StepRange;
  progressType: ProgressType;
  options?: DeckGenerationOptions;
}

// 덱 완료 요청
export interface CompleteDeckRequest {
  autoGenerateNext?: boolean;
  sessionFeedback?: {
    enjoyment: number; // 1-5 scale
    notes?: string;
  };
}

const deckService = {
  /**
   * 새 덱 생성 (슬라이딩 윈도우)
   *
   * @param data - 덱 생성 정보
   * @returns 생성된 덱 정보
   *
   * 예시:
   * ```
   * await deckService.generateDeck({
   *   level: 'N5',
   *   steps: { start: 1, end: 3 },
   *   progressType: 'main',
   *   options: {
   *     excludeCompleted: true,
   *     prioritizeBookmarked: true,
   *     shuffleOrder: true
   *   }
   * });
   * ```
   */
  async generateDeck(data: GenerateDeckRequest): Promise<ApiResponse<Deck>> {
    return api.post('/api/users/me/progress/generate', data);
  },

  /**
   * 현재 활성 덱 조회
   *
   * - UserProgress에서 shuffled_order를 기반으로 덱 반환
   * - 각 단어의 학습 진행 상황 포함
   * - 현재 인덱스, 완료 여부 등 메타 정보 포함
   *
   * @param progressType - 세션 타입 (main/sub)
   */
  async getCurrentDeck(progressType: ProgressType): Promise<ApiResponse<CurrentDeck>> {
    return api.get(`/api/users/me/progress/${progressType}/current`);
  },

  /**
   * 덱 통계 조회
   *
   * - 전체 단어 수, 완료 수, 북마크 수
   * - 평균 정확도, 소요 시간
   * - 난이도 분포, 숙련도 분포
   *
   * @param progressType - 세션 타입 (main/sub)
   */
  async getDeckStats(progressType: ProgressType): Promise<ApiResponse<any>> {
    return api.get(`/api/users/me/progress/${progressType}/deck-stats`);
  },

  /**
   * 덱 완료 및 다음 윈도우 전환
   *
   * - 현재 윈도우가 완료되었는지 확인
   * - 체크포인트 저장
   * - 다음 윈도우 자동 생성 (옵션)
   *
   * @param progressType - 세션 타입
   * @param data - 완료 옵션 (autoGenerateNext, sessionFeedback)
   *
   * 예시:
   * ```
   * await deckService.completeDeck('main', {
   *   autoGenerateNext: true,
   *   sessionFeedback: {
   *     enjoyment: 4,
   *     notes: '좋았어요!'
   *   }
   * });
   * ```
   */
  async completeDeck(progressType: ProgressType, data?: CompleteDeckRequest): Promise<ApiResponse<any>> {
    return api.post(`/api/users/me/progress/${progressType}/complete-deck`, data || {});
  },
};

export default deckService;
