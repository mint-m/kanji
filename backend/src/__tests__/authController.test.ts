import { Response, NextFunction } from 'express';

// --- 모든 외부 모듈을 factory로 명시적 mock ---
jest.mock('../config', () => ({
  __esModule: true,
  validateEnv: jest.fn(),
  default: {
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    JWT_SECRET: 'test-jwt-secret',
    JWT_EXPIRY: '1d',
    KAKAO_REST_API_KEY: 'test-kakao-key',
  },
}));

jest.mock('../models/user', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../services/kakao', () => ({
  getKakaoAccessToken: jest.fn(),
  getKakaoUserInfo: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  generateToken: jest.fn(() => 'mocked-jwt'),
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    setCredentials: jest.fn(),
  })),
}));

jest.mock('googleapis', () => ({
  google: {
    oauth2: jest.fn().mockReturnValue({
      userinfo: {
        get: jest.fn().mockResolvedValue({
          data: { email: 'test@gmail.com', id: 'google-id-456' },
        }),
      },
    }),
  },
}));

import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/user';
import { getKakaoAccessToken, getKakaoUserInfo } from '../services/kakao';
import * as authController from '../controllers/authController';

// --- 헬퍼 ---
const makeRes = () => ({ json: jest.fn() } as unknown as Response);
const makeNext = () => jest.fn() as unknown as NextFunction;
const makeReq = (overrides = {}) =>
  ({ user: { _id: 'user-id-123' }, body: {}, ...overrides } as unknown as AuthenticatedRequest);

// --- linkGoogle ---
describe('linkGoogle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('이미 연동된 Google 계정이면 저장 없이 기존 authProviders 반환', async () => {
    const mockUser = {
      authProviders: [{ provider: 'google', providerId: 'google-id-456' }],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = makeReq({ body: { accessToken: 'valid-token' } });
    await authController.linkGoogle(req, makeRes(), makeNext());

    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it('이미 연동된 Google 계정이면 기존 authProviders를 응답에 반환', async () => {
    const mockUser = {
      authProviders: [{ provider: 'google', providerId: 'google-id-456' }],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = makeReq({ body: { accessToken: 'valid-token' } });
    const res = makeRes();
    await authController.linkGoogle(req, res, makeNext());

    expect(res.json).toHaveBeenCalledWith({ success: true, authProviders: ['google'] });
  });

  it('미연동 Google 계정이면 authProviders에 추가 후 저장', async () => {
    const mockUser = {
      authProviders: [{ provider: 'kakao', providerId: 'kakao-id-789' }],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = makeReq({ body: { accessToken: 'valid-token' } });
    const res = makeRes();
    await authController.linkGoogle(req, res, makeNext());

    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(mockUser.authProviders).toHaveLength(2);
    expect(res.json).toHaveBeenCalledWith({ success: true, authProviders: ['kakao', 'google'] });
  });

  it('인증되지 않은 요청 → UnauthorizedError', async () => {
    const req = makeReq({ user: undefined });
    const next = makeNext();
    await authController.linkGoogle(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('accessToken 누락 → UnauthorizedError', async () => {
    const req = makeReq({ body: {} });
    const next = makeNext();
    await authController.linkGoogle(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('사용자 없음 → NotFoundError', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    const req = makeReq({ body: { accessToken: 'valid-token' } });
    const next = makeNext();
    await authController.linkGoogle(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

// --- linkKakao ---
describe('linkKakao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getKakaoAccessToken as jest.Mock).mockResolvedValue('kakao-access-token');
    (getKakaoUserInfo as jest.Mock).mockResolvedValue({
      kakaoId: 'kakao-id-999',
      email: 'test@kakao.com',
      name: '카카오 유저',
    });
  });

  it('이미 연동된 Kakao 계정이면 저장 없이 기존 authProviders 반환', async () => {
    const mockUser = {
      authProviders: [{ provider: 'kakao', providerId: 'kakao-id-999' }],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = makeReq({ body: { code: 'auth-code', redirectUri: 'http://localhost/callback' } });
    const res = makeRes();
    await authController.linkKakao(req, res, makeNext());

    expect(mockUser.save).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, authProviders: ['kakao'] });
  });

  it('미연동 Kakao 계정이면 authProviders에 추가 후 저장', async () => {
    const mockUser = {
      authProviders: [{ provider: 'google', providerId: 'google-id-123' }],
      save: jest.fn(),
    };
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = makeReq({ body: { code: 'auth-code', redirectUri: 'http://localhost/callback' } });
    const res = makeRes();
    await authController.linkKakao(req, res, makeNext());

    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(mockUser.authProviders).toHaveLength(2);
    expect(res.json).toHaveBeenCalledWith({ success: true, authProviders: ['google', 'kakao'] });
  });

  it('code 누락 → UnauthorizedError', async () => {
    const req = makeReq({ body: { redirectUri: 'http://localhost/callback' } });
    const next = makeNext();
    await authController.linkKakao(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('인증되지 않은 요청 → UnauthorizedError', async () => {
    const req = makeReq({ user: undefined });
    const next = makeNext();
    await authController.linkKakao(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
