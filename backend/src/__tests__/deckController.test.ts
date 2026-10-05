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
    resetWindowCompletionForWords: jest.fn().mockResolvedValue(0),
    distinct: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../models/word', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('../services/slidingWindowService', () => ({
  __esModule: true,
  default: { canMoveToNextWindow: jest.fn() },
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
import SlidingWindowService from '../services/slidingWindowService';
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

  it('index가 서버 위치와 다름 → 409, 아무것도 기록하지 않음', async () => {
    const mockProgress = makeMockProgress({
      shuffled_order: [fakeWordIdObj],
      current_index: 3,
      isAtWord: jest.fn().mockReturnValue(false),
    });
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(mockProgress);

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true, index: 2 } }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PROGRESS_OUT_OF_SYNC', data: { currentIndex: 3 } }),
    );
    expect(WordProgress.findOrCreate).not.toHaveBeenCalled();
    expect(mockProgress.moveToNext).not.toHaveBeenCalled();
    expect(mockProgress.save).not.toHaveBeenCalled();
  });

  it('index가 서버 위치와 같음 → 정상 처리', async () => {
    const mockProgress = makeMockProgress({
      shuffled_order: [fakeWordIdObj],
      isAtWord: jest.fn().mockReturnValue(true),
    });
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(mockProgress);
    (WordProgress.findOrCreate as jest.Mock).mockResolvedValue(makeMockWordProgress());
    (User.findById as jest.Mock).mockResolvedValue(makeUser());

    const res = makeRes();
    await deckController.completeWord(
      makeReq({ params: { progressType: 'main' }, body: { wordId: WORD_ID, isCorrect: true, index: 0 } }),
      res,
    );

    expect(mockProgress.isAtWord).toHaveBeenCalledWith(0, expect.anything());
    expect(mockProgress.moveToNext).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
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

describe('completeDeck', () => {
  beforeEach(() => jest.clearAllMocks());

  const run = async (progressType: 'main' | 'sub', progress: any) => {
    (UserCheckpoint.findByUserAndType as jest.Mock).mockResolvedValue(progress);
    const res = makeRes();
    await deckController.completeDeck(makeReq({ params: { progressType } }), res);
    return res;
  };

  it('세션 없음 → 404', async () => {
    const res = await run('main', null);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('윈도우 미완료 → 400, 다음 윈도우를 만들지 않음', async () => {
    const progress = makeMockProgress({ isWindowCompleted: jest.fn().mockResolvedValue(false), generateNextSlidingWindow: jest.fn() });
    const res = await run('main', progress);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(progress.generateNextSlidingWindow).not.toHaveBeenCalled();
  });

  it('메인 + 다음 윈도우 있음 → 다음 윈도우 생성, canGenerateNext: true', async () => {
    const progress = makeMockProgress({
      isWindowCompleted: jest.fn().mockResolvedValue(true),
      generateNextSlidingWindow: jest.fn().mockImplementation(async function (this: any) {
        this.steps = { start: 2, end: 4 };
        this.shuffled_order = [fakeWordIdObj, fakeWordIdObj];
      }),
    });
    (SlidingWindowService.canMoveToNextWindow as jest.Mock).mockResolvedValue(true);

    const res = await run('main', progress);

    expect(progress.generateNextSlidingWindow).toHaveBeenCalled();
    expect(progress.save).toHaveBeenCalled();
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data).toEqual(expect.objectContaining({
      canGenerateNext: true,
      isSubLoop: false,
      nextWindow: { level: 'N5', steps: { start: 2, end: 4 }, deckSize: 2 },
    }));
    expect(data.completedDeck).toEqual(expect.objectContaining({ level: 'N5', progressType: 'main' }));
  });

  it('메인 + 레벨의 마지막 윈도우 → nextWindow: null, canGenerateNext: false (프론트는 레벨 선택으로 이동)', async () => {
    const progress = makeMockProgress({ isWindowCompleted: jest.fn().mockResolvedValue(true), generateNextSlidingWindow: jest.fn() });
    (SlidingWindowService.canMoveToNextWindow as jest.Mock).mockResolvedValue(false);

    const res = await run('main', progress);

    expect(progress.generateNextSlidingWindow).not.toHaveBeenCalled();
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data).toEqual(expect.objectContaining({ nextWindow: null, canGenerateNext: false, isSubLoop: false }));
  });

  it('서브 → 같은 스텝을 리셋·재셔플, isSubLoop: true (다음 윈도우로 가지 않음)', async () => {
    const progress = makeMockProgress({
      progress_type: 'sub',
      steps: { start: 2, end: 2 },
      shuffled_order: [fakeWordIdObj],
      current_index: 1,
      isWindowCompleted: jest.fn().mockResolvedValue(true),
      generateNextSlidingWindow: jest.fn(),
      markModified: jest.fn(),
    });

    const res = await run('sub', progress);

    expect(WordProgress.resetWindowCompletionForWords).toHaveBeenCalledWith('user-id-123', [fakeWordIdObj], 'sub');
    expect(progress.generateNextSlidingWindow).not.toHaveBeenCalled();
    expect(SlidingWindowService.canMoveToNextWindow).not.toHaveBeenCalled();
    expect(progress.current_index).toBe(0);
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data).toEqual(expect.objectContaining({
      isSubLoop: true,
      canGenerateNext: false,
      nextWindow: { level: 'N5', steps: { start: 2, end: 2 }, deckSize: 1 },
    }));
  });
});
