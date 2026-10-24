const mockWordModel = { aggregate: jest.fn() };
const mockWordReview = { aggregate: jest.fn(), countDue: jest.fn(), findNextDueAt: jest.fn() };

jest.mock('../models/word', () => ({ __esModule: true, default: mockWordModel }));
jest.mock('../models/wordReview', () => ({ __esModule: true, default: mockWordReview, LONG_TERM_STAGE: 4 }));
jest.mock('../models/user', () => ({ __esModule: true, default: { findById: jest.fn() } }));

import { NextFunction, Response, Request } from 'express';
import User from '../models/user';
import { getUserStats } from '../controllers/userStatsController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};
const makeNext = () => jest.fn() as unknown as NextFunction;
const makeReq = () => ({ user: { _id: 'user-id-123' } } as unknown as Request);

const makeUser = () => ({
  statistics: { longestStreak: 7, studyDaysCount: 12, totalWordsStudied: 55 },
  preferences: { dailyGoal: 30 },
  getCurrentStreak: jest.fn().mockReturnValue(3),
  getTodayCount: jest.fn().mockReturnValue(18),
});

const run = async () => {
  const res = makeRes();
  await getUserStats(makeReq(), res, makeNext());
  return (res.json as jest.Mock).mock.calls[0][0];
};

describe('getUserStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWordModel.aggregate.mockResolvedValue([
      { _id: 'N5', count: 100 },
      { _id: 'N4', count: 80 },
    ]);
    mockWordReview.aggregate.mockResolvedValue([{ _id: 'N5', learned: 40, longTerm: 10 }]);
    mockWordReview.countDue.mockResolvedValue(6);
    mockWordReview.findNextDueAt.mockResolvedValue(new Date('2026-10-25T15:00:00Z'));
  });

  it('사용자 없음 → NotFoundError (next 호출, statusCode 404)', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    const next = makeNext();
    await getUserStats(makeReq(), makeRes(), next);
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('익힌 단어·장기 기억은 복습 등록 기준으로 센다 (레벨별 + 합계)', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const { success, data } = await run();
    expect(success).toBe(true);
    expect(data.learned).toEqual({ total: 40, longTerm: 10 });
    expect(data.levels.map((l: any) => l.level)).toEqual(['N5', 'N4', 'N3', 'N2', 'N1', 'daily']);
    expect(data.levels[0]).toEqual({ level: 'N5', total: 100, learned: 40, longTerm: 10 });
    expect(data.levels[1]).toEqual({ level: 'N4', total: 80, learned: 0, longTerm: 0 });
  });

  it('복습 대기 수와 다음 복습 시각', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const { data } = await run();
    expect(data.review).toEqual({ due: 6, nextDueAt: new Date('2026-10-25T15:00:00Z') });
  });

  it('연속 학습일·오늘 학습량·하루 목표·총 응답 수', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const { data } = await run();
    expect(data.streak).toEqual({ current: 3, longest: 7, studyDays: 12 });
    expect(data.today).toEqual({ count: 18, goal: 30 });
    expect(data.totalAnswers).toBe(55);
  });
});
