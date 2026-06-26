jest.mock('../models/user', () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

jest.mock('../models/userCheckpoint', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    createNewSession: jest.fn(),
  },
}));

import { Response, NextFunction } from 'express';
import { Request } from 'express';
import User from '../models/user';
import UserCheckpoint from '../models/userCheckpoint';
import * as userController from '../controllers/userController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeNext = () => jest.fn() as unknown as NextFunction;

const makeReq = (overrides = {}) =>
  ({ user: { _id: 'user-id-123' }, body: {}, params: {}, ...overrides } as unknown as Request);

const makeUser = () => ({
  _id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  activeProgressType: 'main',
});

const makeMockCheckpoint = (overrides: any = {}) => ({
  _id: 'checkpoint-id',
  progress_type: 'main',
  current_level: 'N5',
  steps: { start: 1, end: 3 },
  current_index: 0,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('getUserProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('사용자 없음 → NotFoundError', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    const next = makeNext();
    await userController.getUserProfile(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('성공 → 사용자 프로필 반환', async () => {
    const mockUser = makeUser();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    const res = makeRes();
    await userController.getUserProfile(makeReq(), res, makeNext());
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });
});

describe('updateActiveProgressType', () => {
  beforeEach(() => jest.clearAllMocks());

  it('사용자 없음 → NotFoundError', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
    const next = makeNext();
    await userController.updateActiveProgressType(
      makeReq({ body: { activeProgressType: 'sub' } }),
      makeRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('성공 → activeProgressType 업데이트', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...makeUser(), activeProgressType: 'sub' });
    const res = makeRes();
    await userController.updateActiveProgressType(
      makeReq({ body: { activeProgressType: 'sub' } }),
      res,
      makeNext(),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { activeProgressType: 'sub' } }),
    );
  });
});

describe('updateCheckpoint', () => {
  beforeEach(() => jest.clearAllMocks());

  it('level·steps 없음 → BadRequestError', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const next = makeNext();
    await userController.updateCheckpoint(makeReq({ body: { progressType: 'main' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(400);
  });

  it('잘못된 progressType → BadRequestError', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const next = makeNext();
    await userController.updateCheckpoint(
      makeReq({ body: { progressType: 'invalid', level: 'N5', steps: { start: 1, end: 3 } } }),
      makeRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(400);
  });

  it('세션 없음 → createNewSession 호출 후 성공', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    (UserCheckpoint.findOne as jest.Mock).mockResolvedValue(null);
    (UserCheckpoint.createNewSession as jest.Mock).mockResolvedValue(makeMockCheckpoint());
    const res = makeRes();
    await userController.updateCheckpoint(
      makeReq({ body: { progressType: 'main', level: 'N5', steps: { start: 1, end: 3 } } }),
      res,
      makeNext(),
    );
    expect(UserCheckpoint.createNewSession).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('세션 존재 → 기존 checkpoint 업데이트 후 성공', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const existing = makeMockCheckpoint();
    (UserCheckpoint.findOne as jest.Mock).mockResolvedValue(existing);
    const res = makeRes();
    await userController.updateCheckpoint(
      makeReq({ body: { progressType: 'main', level: 'N4', steps: { start: 2, end: 4 }, currentIndex: 5 } }),
      res,
      makeNext(),
    );
    expect(existing.save).toHaveBeenCalled();
    expect(existing.current_level).toBe('N4');
    expect(existing.current_index).toBe(5);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
