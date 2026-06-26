const mockWord = {
  countDocuments: jest.fn().mockResolvedValue(100),
  distinct: jest.fn().mockResolvedValue([]),
};

jest.mock('mongoose', () => ({
  model: jest.fn().mockReturnValue(mockWord),
}));

jest.mock('../models/user', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('../models/userCheckpoint', () => ({ __esModule: true, default: { findByUserAndType: jest.fn() } }));
jest.mock('../models/wordProgress', () => ({ __esModule: true, default: { countDocuments: jest.fn() } }));

import { NextFunction, Response, Request } from 'express';
import User from '../models/user';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import { getUserStats } from '../controllers/userStatsController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};
const makeNext = () => jest.fn() as unknown as NextFunction;
const makeReq = () => ({ user: { _id: 'user-id-123' } } as unknown as Request);

const makeUser = (overrides = {}) => ({
  statistics: { currentStreak: 3, longestStreak: 7, studyDaysCount: 12, totalWordsStudied: 55, ...overrides },
});

describe('getUserStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWord.countDocuments.mockResolvedValue(100);
    mockWord.distinct.mockResolvedValue([]);
    (WordProgress.countDocuments as jest.Mock).mockResolvedValue(10);
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(null);
  });

  it('사용자 없음 → NotFoundError (next 호출, statusCode 404)', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    const next = makeNext();
    await getUserStats(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('응답에 streak 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.streak).toEqual({ current: 3, longest: 7, studyDays: 12 });
  });

  it('응답에 totalWordsStudied 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.totalWordsStudied).toBe(55);
  });

  it('levelBreakdown 배열이 N5~N1 5개 반환', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.levelBreakdown).toHaveLength(5);
    expect(body.levelBreakdown.map((l: any) => l.level)).toEqual(['N5', 'N4', 'N3', 'N2', 'N1']);
  });

  it('overall 진행률 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    (WordProgress.countDocuments as jest.Mock).mockResolvedValue(25);
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.overall).toMatchObject({ completedWords: 25, progressPercentage: expect.any(Number) });
  });
});
