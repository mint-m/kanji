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
  getWindowProgress: jest.fn().mockResolvedValue({ total: 30, known: 7 }),
  isCompleted: jest.fn().mockReturnValue(false),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
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

describe('getAllSessions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세션 카드용 요약에 윈도우 진행(익힘/전체)을 담는다', async () => {
    (UserCheckpoint.getActiveProgressForUser as jest.Mock).mockResolvedValue([makeMockProgress()]);
    const res = makeRes();
    await progressController.getAllSessions(makeReq(), res);
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.totalSessions).toBe(1);
    expect(data.sessions[0]).toEqual(expect.objectContaining({
      type: 'main', level: 'N5', steps: { start: 1, end: 3 }, window: { total: 30, known: 7 },
    }));
  });
});
