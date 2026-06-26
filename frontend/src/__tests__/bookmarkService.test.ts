import bookmarkService from '../services/bookmarkService';
import { api } from '../services/apiClient';

jest.mock('../services/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

describe('bookmarkService.getBookmarks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sortBy recent → last_studied_at으로 변환해서 전송', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: null });
    await bookmarkService.getBookmarks({ sortBy: 'recent' });
    expect(api.get as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=last_studied_at'),
    );
  });

  it('sortBy level → 그대로 전송', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: null });
    await bookmarkService.getBookmarks({ sortBy: 'level' });
    expect(api.get as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=level'),
    );
  });

  it('옵션 없음 → 쿼리 없이 base URL 호출', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: null });
    await bookmarkService.getBookmarks();
    expect(api.get as jest.Mock).toHaveBeenCalledWith('/api/users/me/bookmarks');
  });

  it('level 필터 + sortBy 조합 → 쿼리에 모두 포함', async () => {
    (api.get as jest.Mock).mockResolvedValue({ success: true, data: null });
    await bookmarkService.getBookmarks({ level: 'N3', sortBy: 'recent', page: 2 });
    const url = (api.get as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('level=N3');
    expect(url).toContain('sortBy=last_studied_at');
    expect(url).toContain('page=2');
  });
});
