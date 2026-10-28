import React from 'react';
import { render, waitFor } from '@testing-library/react';

// mock 모듈
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));
jest.mock('../services/authService', () => ({
  loginWithKakaoCode: jest.fn(),
  linkKakaoAccount: jest.fn(),
  toUserState: jest.fn((user: any) => ({ ...user, isLoggedIn: true })),
  getUserLocally: jest.fn(),
  saveUserLocally: jest.fn(),
}));
jest.mock('../store/modules/user', () => ({
  setUser: jest.fn((payload: any) => ({ type: 'user/setUser', payload })),
}));

import { loginWithKakaoCode, linkKakaoAccount, getUserLocally, saveUserLocally } from '../services/authService';

// 컴포넌트가 모듈 로드 시점에 env를 읽으므로 require 전에 설정한다 (로컬 .env 없이도 통과하도록)
process.env.REACT_APP_KAKAO_REDIRECT_URI = 'http://localhost/auth/kakao/callback';
const KakaoOAuthCallback = require('../components/auth/KakaoOAuthCallback').default;

const setSearchParams = (params: Record<string, string>) => {
  const url = new URL('http://localhost/auth/kakao/callback');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  delete (window as any).location;
  (window as any).location = { search: url.search, href: '' };
};

describe('KakaoOAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('code 없으면 /login으로 리다이렉트', async () => {
    setSearchParams({});

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
    expect(loginWithKakaoCode).not.toHaveBeenCalled();
  });

  it('state 없을 때 loginWithKakaoCode 호출 후 / 으로 이동', async () => {
    setSearchParams({ code: 'kakao-auth-code' });
    const mockUser = { _id: 'u1', email: 'a@b.com', name: '유저', type: 'kakao', activeProgressType: null };
    (loginWithKakaoCode as jest.Mock).mockResolvedValue({ token: 'jwt', user: mockUser });

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(loginWithKakaoCode).toHaveBeenCalledWith('kakao-auth-code', expect.any(String));
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('state=link일 때 linkKakaoAccount 호출 후 /profile로 이동', async () => {
    setSearchParams({ code: 'kakao-auth-code', state: 'link' });
    const storedUser = { _id: 'u1', email: 'a@b.com', name: '유저', type: 'google', activeProgressType: null, authProviders: ['google'] };
    (getUserLocally as jest.Mock).mockReturnValue(storedUser);
    (linkKakaoAccount as jest.Mock).mockResolvedValue(['google', 'kakao']);

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(linkKakaoAccount).toHaveBeenCalledWith('kakao-auth-code', expect.any(String));
      expect(saveUserLocally).toHaveBeenCalledWith({ ...storedUser, authProviders: ['google', 'kakao'] });
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
    expect(loginWithKakaoCode).not.toHaveBeenCalled();
  });

  it('state=link이고 getUserLocally가 null이어도 /profile로 이동', async () => {
    setSearchParams({ code: 'kakao-auth-code', state: 'link' });
    (getUserLocally as jest.Mock).mockReturnValue(null);
    (linkKakaoAccount as jest.Mock).mockResolvedValue(['google', 'kakao']);

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(saveUserLocally).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
  });

  it('loginWithKakaoCode 실패 시 /login으로 이동', async () => {
    setSearchParams({ code: 'bad-code' });
    (loginWithKakaoCode as jest.Mock).mockRejectedValue(new Error('login failed'));

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: { error: '카카오 로그인에 실패했습니다.' } });
    });
  });

  it('linkKakaoAccount 실패 시 /profile로 이동', async () => {
    setSearchParams({ code: 'bad-code', state: 'link' });
    (linkKakaoAccount as jest.Mock).mockRejectedValue(new Error('link failed'));

    render(<KakaoOAuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true, state: { linkError: '카카오 계정 연동에 실패했습니다.' } });
    });
  });
});
