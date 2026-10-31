import { api } from './apiClient';
import {
  ApiResponse,
  CompleteWordRequest,
  CompleteWordResponse,
  LearningLevel,
  ProgressType,
  StepRange,
  SessionSummary,
} from './types';

const progressService = {
  async getAllSessions(): Promise<ApiResponse<{ sessions: SessionSummary[]; totalSessions: number }>> {
    return api.get('/api/users/me/progress');
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
  ): Promise<ApiResponse<unknown>> {
    return api.patch(`/api/users/me/checkpoint`, { progressType, level, steps });
  },
};

export default progressService;
