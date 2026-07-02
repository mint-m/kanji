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

  async deleteSession(type: ProgressType): Promise<ApiResponse<any>> {
    return api.delete(`/api/users/me/progress/${type}`);
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
