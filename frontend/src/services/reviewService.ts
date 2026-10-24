import { api } from './apiClient';
import { ApiResponse, DueReviews } from './types';

// 간격 복습 단계별 다음 복습까지의 일수 (서버 REVIEW_INTERVAL_DAYS와 같다)
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];

const reviewService = {
  async getDue(limit = 50): Promise<DueReviews> {
    const res = await api.get<ApiResponse<DueReviews>>(`/api/users/me/reviews/due?limit=${limit}`);
    return res.data!;
  },

  async answer(wordId: string, isCorrect: boolean, timeSpent?: number): Promise<{ applied: boolean; stage: number; nextReviewAt: string }> {
    const res = await api.post<ApiResponse<{ applied: boolean; stage: number; nextReviewAt: string }>>(
      '/api/users/me/reviews/answer',
      { wordId, isCorrect, timeSpent }
    );
    return res.data!;
  },
};

export default reviewService;
