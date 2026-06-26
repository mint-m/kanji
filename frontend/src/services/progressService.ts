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

export interface GetProgressResponse {
  progress: UserProgress;
  sessionStats: SessionStats;
  currentWord: string | null;
  remainingWords: number;
  canMoveToNextWindow: boolean;
}

export interface UpdateIndexRequest {
  action: 'next' | 'previous' | 'jump';
  index?: number;
}

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

export interface CheckpointUpdateData {
  progress_type: ProgressType;
  current_level: LearningLevel;
  steps: StepRange;
  current_index: number;
  updated_at: string;
}

const progressService = {
  async getAllSessions(): Promise<ApiResponse<{ sessions: any[]; totalSessions: number }>> {
    return api.get('/api/users/me/progress');
  },

  async getUserProgress(type: ProgressType): Promise<ApiResponse<GetProgressResponse>> {
    return api.get(`/api/users/me/progress/${type}`);
  },

  async updateWordIndex(type: ProgressType, data: UpdateIndexRequest): Promise<ApiResponse<any>> {
    return api.put(`/api/users/me/progress/${type}/index`, data);
  },

  async resetSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.put(`/api/users/me/progress/${type}/reset`);
  },

  async deleteSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.delete(`/api/users/me/progress/${type}`);
  },

  async getLearningStats(): Promise<ApiResponse<LearningStatsResponse>> {
    return api.get('/api/users/me/progress/stats');
  },

  async completeWord(
    progressType: ProgressType,
    data: CompleteWordRequest
  ): Promise<ApiResponse<CompleteWordResponse>> {
    return api.post(`/api/users/me/progress/${progressType}/complete-word`, data);
  },

  async saveCheckpoint(
    progressType: ProgressType,
    level: LearningLevel,
    steps: StepRange
  ): Promise<ApiResponse<CheckpointUpdateData>> {
    return api.patch(`/api/users/me/checkpoint`, { progressType, level, steps });
  },
};

export default progressService;
