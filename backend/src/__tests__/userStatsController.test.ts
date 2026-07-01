const mockWordModel = {
  aggregate: jest.fn(),
};

jest.mock('../models/word', () => ({ __esModule: true, default: mockWordModel }));
jest.mock('../models/user', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('../models/userCheckpoint', () => ({ __esModule: true, default: { findByUserAndType: jest.fn() } }));
jest.mock('../models/wordProgress', () => ({ __esModule: true, default: { aggregate: jest.fn() } }));

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

// Word.aggregate 기본 반환값: 레벨별 단어 수
const defaultWordCountByLevel = [
  { _id: 'N5', count: 20 },
  { _id: 'N4', count: 20 },
  { _id: 'N3', count: 20 },
  { _id: 'N2', count: 20 },
  { _id: 'N1', count: 20 },
];

describe('getUserStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWordModel.aggregate.mockResolvedValue(defaultWordCountByLevel);
    (WordProgress.aggregate as jest.Mock).mockResolvedValue([]);
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

  it('levelBreakdown 배열이 daily·N5~N1 6개 반환', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.levelBreakdown).toHaveLength(6);
    expect(body.levelBreakdown.map((l: any) => l.level)).toEqual(['N5', 'N4', 'N3', 'N2', 'N1', 'daily']);
  });

  it('overall 진행률 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    // N5에서 25단어 완료
    (WordProgress.aggregate as jest.Mock).mockResolvedValue([{ _id: 'N5', count: 25 }]);
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.overall).toMatchObject({ completedWords: 25, progressPercentage: expect.any(Number) });
  });

  it('overall.totalWords는 Word.aggregate 결과 합산', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    // defaultWordCountByLevel: 5 레벨 × 20개 = 100
    expect(body.overall.totalWords).toBe(100);
  });

  it('levelBreakdown 각 항목에 total·completed·percentage 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    (WordProgress.aggregate as jest.Mock).mockResolvedValue([{ _id: 'N5', count: 10 }]);
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    const n5 = body.levelBreakdown.find((l: any) => l.level === 'N5');
    expect(n5).toMatchObject({ level: 'N5', total: 20, completed: 10, percentage: 50 });
  });

  it('main 세션이 있으면 sessions 배열에 포함', async () => {
    (User.findById as jest.Mock).mockResolvedValue(makeUser());
    const mockProgress = {
      current_level: 'N5',
      steps: { start: 1, end: 3 },
      getSessionStats: jest.fn().mockReturnValue({ completedWords: 5, totalWords: 10, progressPercentage: 50 }),
    };
    (UserCheckpoint.findByUserAndType as jest.Mock)
      .mockResolvedValueOnce(mockProgress) // main
      .mockResolvedValueOnce(null);        // sub
    const res = makeRes();
    await getUserStats(makeReq(), res, makeNext());
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].type).toBe('main');
    expect(body.sessions[0].currentLevel).toBe('N5');
  });
});
