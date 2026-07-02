// apiClient를 먼저 mock (axios.create interceptors 문제 회피)
jest.mock('../services/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  AxiosError: class AxiosError extends Error { constructor(msg?: string) { super(msg); } },
  isAxiosError: jest.fn(),
}));
jest.mock('../store', () => ({
  dispatch: jest.fn(),
  getState: jest.fn(() => ({})),
}));
jest.mock('../store/modules/user', () => ({
  clearUser: jest.fn(() => ({ type: 'user/clearUser' })),
  setUser: jest.fn((p: any) => ({ type: 'user/setUser', payload: p })),
}));

import { toUserState, getUserLocally, saveUserLocally, getTokenLocally, saveTokenLocally, removeTokenLocally, removeUserLocally } from '../services/authService';
import type { UserProfile } from '../services/authService';

const mockUser: UserProfile = {
  _id: 'abc123',
  email: 'test@example.com',
  name: '테스트유저',
  type: 'google',
  activeProgressType: 'main',
  authProviders: ['google'],
};

// --- toUserState ---
describe('toUserState', () => {
  it('UserProfile → Redux user state 변환', () => {
    const state = toUserState(mockUser);
    expect(state).toEqual({
      isLoggedIn: true,
      loginStatusType: 'google',
      email: 'test@example.com',
      name: '테스트유저',
      activeProgressType: 'main',
    });
  });

  it('activeProgressType null이면 null 유지', () => {
    const state = toUserState({ ...mockUser, activeProgressType: null });
    expect(state.activeProgressType).toBeNull();
  });

  it('kakao 타입도 올바르게 변환', () => {
    const state = toUserState({ ...mockUser, type: 'kakao' });
    expect(state.loginStatusType).toBe('kakao');
  });
});

// --- localStorage helpers ---
describe('localStorage helpers', () => {
  beforeEach(() => localStorage.clear());

  it('saveTokenLocally / getTokenLocally 저장 및 조회', () => {
    saveTokenLocally('test-token');
    expect(getTokenLocally()).toBe('test-token');
  });

  it('removeTokenLocally 삭제', () => {
    saveTokenLocally('test-token');
    removeTokenLocally();
    expect(getTokenLocally()).toBeNull();
  });

  it('saveUserLocally / getUserLocally 저장 및 조회', () => {
    saveUserLocally(mockUser);
    expect(getUserLocally()).toEqual(mockUser);
  });

  it('removeUserLocally 삭제', () => {
    saveUserLocally(mockUser);
    removeUserLocally();
    expect(getUserLocally()).toBeNull();
  });

  it('getUserLocally: 손상된 JSON이면 null 반환 후 삭제', () => {
    localStorage.setItem('user', '{invalid-json}');
    expect(getUserLocally()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('getUserLocally: 저장된 데이터 없으면 null', () => {
    expect(getUserLocally()).toBeNull();
  });
});
