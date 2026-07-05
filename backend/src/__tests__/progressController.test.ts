jest.mock('../models/userCheckpoint', () => ({
  __esModule: true,
  default: {
    findByUserAndType: jest.fn(),
    getActiveProgressForUser: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import UserCheckpoint from '../models/userCheckpoint';
import * as progressController from '../controllers/progressController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeReq = (overrides = {}) =>
  ({ user: { _id: 'user-id-123' }, body: {}, params: {}, ...overrides } as unknown as AuthenticatedRequest);

const makeMockProgress = (overrides: any = {}) => ({
  shuffled_order: [],
  current_index: 0,
  current_level: 'N5',
  steps: { start: 1, end: 3 },
  progress_type: 'main',
  getSessionStats: jest.fn().mockReturnValue({ totalWords: 0, completedWords: 0, remainingWords: 0, progressPercentage: 0 }),
  getCurrentWord: jest.fn().mockReturnValue(null),
  getRemainingWords: jest.fn().mockReturnValue([]),
  canMoveToNextWindow: jest.fn().mockResolvedValue(false),
  isCompleted: jest.fn().mockReturnValue(false),
  save: jest.fn().mockResolvedValue(undefined),
  resetProgress: jest.fn(),
  ...overrides,
});

describe('getUserProgress', () => {
  beforeEach(() => jest.clearAllMocks());

  it('잘못된 type → 400', async () => {
    const res = makeRes();
    await progressController.getUserProgress(makeReq({ params: { type: 'invalid' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('진행 데이터 없음 → 404', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(null);
    const res = makeRes();
    await progressController.getUserProgress(makeReq({ params: { type: 'main' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('성공 → sessionStats 포함 응답', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(makeMockProgress());
    const res = makeRes();
    await progressController.getUserProgress(makeReq({ params: { type: 'main' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect((res.json as jest.Mock).mock.calls[0][0].data).toHaveProperty('sessionStats');
  });
});
describe('deleteSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세션 없음 → 404', async () => {
    (UserCheckpoint.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });
    const res = makeRes();
    await progressController.deleteSession(makeReq({ params: { type: 'main' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('성공 → 200', async () => {
    (UserCheckpoint.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
    const res = makeRes();
    await progressController.deleteSession(makeReq({ params: { type: 'main' } }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
