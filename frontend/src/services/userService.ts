import { api } from './apiClient';
import { ApiResponse, UserStats } from './types';

/**
 * 사용자 프로필 조회
 */
export const getProfile = async (): Promise<any> => {
  return api.get('/api/auth/profile');
};

/**
 * 학습 기록 조회
 */
export const getStats = async (): Promise<UserStats> => {
  const res = await api.get<ApiResponse<UserStats>>('/api/users/me/stats');
  return res.data!;
};

/**
 * 하루 목표 단어 수 변경
 */
export const updateDailyGoal = async (dailyGoal: number): Promise<number> => {
  const res = await api.patch<ApiResponse<{ dailyGoal: number }>>('/api/users/me/preferences', { dailyGoal });
  return res.data!.dailyGoal;
};

/**
 * 닉네임(이름) 변경
 */
export const updateName = async (name: string): Promise<{ name: string }> => {
  const res = await api.patch<{ success: boolean; data: { name: string } }>('/api/users/me', { name });
  return res.data;
};

/**
 * 활성 진행 타입 업데이트
 */
export const updateActiveProgressType = async (
  activeProgressType: 'main' | 'sub' | null
): Promise<void> => {
  await api.patch('/api/users/me/active-progress-type', { activeProgressType });
};
