jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id: string) => ({
      toString: () => id,
      equals: (other: any) => other?.toString?.() === id,
    })),
  },
}));

jest.mock('../models/userCheckpoint', () => ({
  __esModule: true,
  default: { findByUserAndType: jest.fn() },
}));

jest.mock('../models/wordProgress', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOrCreate: jest.fn(),
    distinct: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../models/word', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('../models/user', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import UserCheckpoint from '../models/userCheckpoint';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import User from '../models/user';
import * as deckController from '../controllers/deckController';

const WORD_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const fakeWordIdObj = { toString: () => WORD_ID, equals: (o: any) => o?.toString() === WORD_ID };

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
  created_at: new Date(),
  updated_at: new Date(),
  isCompleted: jest.fn().mockReturnValue(false),
  isWindowCompleted: jest.fn().mockResolvedValue(false),
  canMoveToNextWindow: jest.fn().mockResolvedValue(false),
  getSessionStats: jest.fn().mockReturnValue({
    totalWords: 0, completedWords: 0, remainingWords: 0,
    progressPercentage: 0, averageWordsPerStep: 5, currentStep: 1, totalSteps: 3,
  }),
  moveToNext: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  reshuffleUnknownWords: jest.fn().mockResolvedValue(1),
  ...overrides,
});

const makeMockWordProgress = (overrides: any = {}) => ({
  try_count: 0,
  correct_count: 1,
  study_streak: 0,
  is_bookmarked: false,
  recordStudyAttempt: jest.fn(),
  markCompleted: jest.fn(),
  markIncomplete: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  calculateMasteryLevel: jest.fn().mockReturnValue('beginner'),
  getRecommendedAction: jest.fn().mockReturnValue('continue'),
  ...overrides,
});

const makeUser = () => ({
  updateStudyStats: jest.fn(),
  updateDailyStreak: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

describe('getCurrentDeck', () => {
  beforeEach(() => jest.clearAllMocks());

  it('잘못된 progressType → 400', async () => {
    const req = makeReq({ params: { progressType: 'invalid' } });
    const res = makeRes();
    await deckController.getCurrentDeck(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('진행 중인 세션 없음 → 404, NO_PROGRESS 코드 반환', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(null);
    const req = makeReq({ params: { progressType: 'main' } });
    const res = makeRes();
    await deckController.getCurrentDeck(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_PROGRESS' }));
  });

  it('성공 → deckId, level, words 반환', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(makeMockProgress());
    (Word.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    (WordProgress.find as jest.Mock).mockResolvedValue([]);

    const res = makeRes();
    await deckController.getCurrentDeck(makeReq({ params: { progressType: 'main' } }), res);

    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data).toHaveProperty('deckId');
    expect(data).toHaveProperty('words');
    expect(data.level).toBe('N5');
  });
});

describe('completeWord', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세션 없음 → 404', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(null);
    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('단어가 덱에 없음 → 400', async () => {
    const mockProgress = makeMockProgress({
      shuffled_order: [{ toString: () => 'other-id', equals: () => false }],
    });
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(mockProgress);

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Word is not in current deck' }));
  });

  it('성공 - 패스 미완료 → passComplete: false, windowComplete: false 반환', async () => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(
      makeMockProgress({ shuffled_order: [fakeWordIdObj], isCompleted: jest.fn().mockReturnValue(false) }),
    );
    (WordProgress.findOrCreate as jest.Mock).mockResolvedValue(makeMockWordProgress());
    const mockUser = makeUser();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true, timeSpent: 5 } }),
      res,
    );

    expect(mockUser.updateDailyStreak).toHaveBeenCalled();
    expect(mockUser.updateStudyStats).toHaveBeenCalledWith(5, 1);
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.passComplete).toBe(false);
    expect(data.windowComplete).toBe(false);
  });

  it('패스 완료 + 모르는 단어 있음 → reshuffleUnknownWords 호출, nextPassSize 반환', async () => {
    const mockProgress = makeMockProgress({
      shuffled_order: [fakeWordIdObj],
      isCompleted: jest.fn().mockReturnValue(true),
      isWindowCompleted: jest.fn().mockResolvedValue(false),
    });
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(mockProgress);
    (WordProgress.findOrCreate as jest.Mock).mockResolvedValue(makeMockWordProgress());
    (User.findById as jest.Mock).mockResolvedValue(makeUser());

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: false, timeSpent: 5 } }),
      res,
    );

    expect(mockProgress.reshuffleUnknownWords).toHaveBeenCalled();
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.passComplete).toBe(true);
    expect(data.windowComplete).toBe(false);
    expect(data.nextPassSize).toBe(1);
  });

  it('패스 완료 + 모두 외움 → windowComplete: true, reshuffleUnknownWords 미호출', async () => {
    const mockProgress = makeMockProgress({
      shuffled_order: [fakeWordIdObj],
      isCompleted: jest.fn().mockReturnValue(true),
      isWindowCompleted: jest.fn().mockResolvedValue(true),
    });
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(mockProgress);
    (WordProgress.findOrCreate as jest.Mock).mockResolvedValue(makeMockWordProgress());
    (User.findById as jest.Mock).mockResolvedValue(makeUser());

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true, timeSpent: 5 } }),
      res,
    );

    expect(mockProgress.reshuffleUnknownWords).not.toHaveBeenCalled();
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.passComplete).toBe(true);
    expect(data.windowComplete).toBe(true);
  });
});
