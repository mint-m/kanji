// jest.mock factory에서 참조하기 위해 파일 스코프에 선언
let mockWPInstance: any;
const MockWordProgress = jest.fn() as any;
MockWordProgress.findOne = jest.fn();
MockWordProgress.countDocuments = jest.fn().mockResolvedValue(0);
MockWordProgress.aggregate = jest.fn();
MockWordProgress.updateMany = jest.fn();
MockWordProgress.getBookmarkAnalytics = jest.fn();

jest.mock('../models/wordProgress', () => ({ __esModule: true, default: MockWordProgress }));
jest.mock('../models/word', () => ({ __esModule: true, default: { findById: jest.fn() } }));

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import WordProgress from '../models/wordProgress';
import Word from '../models/word';
import * as bookmarkController from '../controllers/bookmarkController';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const makeReq = (overrides = {}) =>
  ({ user: { _id: 'user-id-123' }, body: {}, params: {}, query: {}, ...overrides } as unknown as AuthenticatedRequest);

describe('toggleBookmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWPInstance = {
      toggleBookmark: jest.fn().mockReturnValue(true),
      save: jest.fn().mockResolvedValue(undefined),
      getBookmarkInfo: jest.fn().mockReturnValue({ isBookmarked: true, tags: [] }),
      bookmark_reason: undefined,
      bookmark_tags: [],
    };
    MockWordProgress.mockImplementation(() => mockWPInstance);
  });

  it('진행 데이터 없을 때 → 새 WordProgress 생성 후 북마크', async () => {
    (WordProgress.findOne as jest.Mock).mockResolvedValue(null);
    (Word.findById as jest.Mock).mockResolvedValue({ entry: 'てすと', pron: 'テスト', means: ['테스트'] });

    const res = makeRes();
    await bookmarkController.toggleBookmark(
      makeReq({ body: { wordId: 'word-id-1', progressType: 'main' } }),
      res,
    );

    expect(MockWordProgress).toHaveBeenCalled();
    expect(mockWPInstance.save).toHaveBeenCalled();
    expect((res.json as jest.Mock).mock.calls[0][0].data.isBookmarked).toBe(true);
  });

  it('기존 북마크 토글 → 북마크 해제', async () => {
    const existingWP = {
      is_bookmarked: true,
      toggleBookmark: jest.fn().mockReturnValue(false),
      save: jest.fn().mockResolvedValue(undefined),
      getBookmarkInfo: jest.fn().mockReturnValue({ isBookmarked: false, tags: [] }),
    };
    (WordProgress.findOne as jest.Mock).mockResolvedValue(existingWP);
    (Word.findById as jest.Mock).mockResolvedValue(null);

    const res = makeRes();
    await bookmarkController.toggleBookmark(
      makeReq({ body: { wordId: 'word-id-1', progressType: 'main' } }),
      res,
    );

    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.data.isBookmarked).toBe(false);
    expect(response.message).toMatch(/unbookmarked/);
  });
});

describe('getBookmarks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('성공 → 북마크 목록과 페이지네이션 반환', async () => {
    (WordProgress.aggregate as jest.Mock)
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ _id: 'wp1', word: { entry: 'てすと' } }]);

    const res = makeRes();
    await bookmarkController.getBookmarks(makeReq({ query: { page: '1', limit: '20' } }), res);

    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.bookmarks).toHaveLength(1);
    expect(data.pagination.totalItems).toBe(1);
    expect(data.pagination.currentPage).toBe(1);
  });
});

describe('updateBookmark', () => {
  beforeEach(() => jest.clearAllMocks());

  it('북마크된 단어 없음 → 404', async () => {
    (WordProgress.updateMany as jest.Mock).mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
    const res = makeRes();
    await bookmarkController.updateBookmark(
      makeReq({ params: { wordId: 'word-id-1' }, body: { reason: '어렵다' } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('성공 → reason·tags 업데이트 후 반환', async () => {
    (WordProgress.updateMany as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

    const res = makeRes();
    await bookmarkController.updateBookmark(
      makeReq({ params: { wordId: 'word-id-1' }, body: { reason: '어렵다', tags: ['문법'] } }),
      res,
    );

    expect(WordProgress.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ word_id: 'word-id-1', is_bookmarked: true }),
      expect.objectContaining({ $set: { bookmark_reason: '어렵다', bookmark_tags: ['문법'] } }),
    );
    const { data } = (res.json as jest.Mock).mock.calls[0][0];
    expect(data.wordId).toBe('word-id-1');
    expect(data.reason).toBe('어렵다');
    expect(data.tags).toEqual(['문법']);
  });
});
