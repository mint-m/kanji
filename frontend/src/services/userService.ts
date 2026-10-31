import { api } from './apiClient';
import { getTokenLocally } from './authService';
import { ApiResponse, Preferences, UserStats } from './types';

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

// 학습 설정은 한 번 받아 두고 카드마다 다시 묻지 않는다 — 로그인한 사람(토큰)이 바뀌면 다시 받는다
type PreferencesCache = { token: string | null; request: Promise<Preferences>; value?: Preferences };
let preferences: PreferencesCache | null = null;

const fetchPreferences = async () =>
  (await api.get<ApiResponse<Preferences>>('/api/users/me/preferences')).data!;

/**
 * 학습 설정 조회 (하루 목표, 학습 카드를 누를 때 먼저 보일 것)
 */
export const getPreferences = (): Promise<Preferences> => {
  const token = getTokenLocally();
  if (preferences && preferences.token === token) return preferences.request;
  const entry: PreferencesCache = { token, request: fetchPreferences() };
  entry.request.then(
    (value) => { entry.value = value; },
    () => { if (preferences === entry) preferences = null; }, // 실패는 기억하지 않는다
  );
  preferences = entry;
  return entry.request;
};

// 받아 둔 설정 — 카드가 바뀔 때마다 기본값이 한 프레임 보였다 바뀌지 않게 첫 그림부터 쓴다
export const knownPreferences = (): Preferences | undefined =>
  preferences && preferences.token === getTokenLocally() ? preferences.value : undefined;

/**
 * 학습 설정 변경 — 보낸 것만 바꾼다
 */
export const updatePreferences = async (changes: Partial<Preferences>): Promise<Preferences> => {
  const res = await api.patch<ApiResponse<Preferences>>('/api/users/me/preferences', changes);
  const value = res.data!;
  preferences = { token: getTokenLocally(), request: Promise.resolve(value), value };
  return value;
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
