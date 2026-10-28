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

describe('updateUserName', () => {
  beforeEach(() => jest.clearAllMocks());

  it('빈 닉네임 → BadRequestError', async () => {
    const next = makeNext();
    await userController.updateUserName(makeReq({ body: { name: '   ' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('20자 초과 → BadRequestError', async () => {
    const next = makeNext();
    await userController.updateUserName(makeReq({ body: { name: 'a'.repeat(21) } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('사용자 없음 → NotFoundError', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
    const next = makeNext();
    await userController.updateUserName(makeReq({ body: { name: '새이름' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('성공 → 트림된 닉네임 반환', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...makeUser(), name: '새이름' });
    const res = makeRes();
    await userController.updateUserName(makeReq({ body: { name: '  새이름  ' } }), res, makeNext());
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-id-123', { name: '새이름' }, { new: true });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { name: '새이름' } }),
    );
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

  it('세션 존재 → 409, 덱을 바꾸지 않음 (레벨·스텝만 바꾸면 덱이 이전 단어로 남기 때문)', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const existing = makeMockCheckpoint();
    (UserCheckpoint.findOne as jest.Mock).mockResolvedValue(existing);
    const next = makeNext();
    await userController.updateCheckpoint(
      makeReq({ body: { progressType: 'main', level: 'N4', steps: { start: 2, end: 4 } } }),
      makeRes(),
      next,
    );
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(409);
    expect(existing.save).not.toHaveBeenCalled();
    expect(UserCheckpoint.createNewSession).not.toHaveBeenCalled();
  });
});
