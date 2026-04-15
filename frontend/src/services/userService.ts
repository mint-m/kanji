import { api } from './apiClient';

/**
 * 사용자 프로필 조회
 */
export const getProfile = async (): Promise<any> => {
  return api.get('/api/auth/profile');
};

/**
 * 사용자 통계 조회
 */
export const getStats = async (): Promise<any> => {
  return api.get('/api/users/me/stats');
};

/**
 * 활성 진행 타입 업데이트
 */
export const updateActiveProgressType = async (
  activeProgressType: 'main' | 'sub' | null
): Promise<void> => {
  await api.patch('/api/users/me/active-progress-type', { activeProgressType });
};
