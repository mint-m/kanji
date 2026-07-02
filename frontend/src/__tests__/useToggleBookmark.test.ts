import { renderHook, act } from '@testing-library/react';
import { useToggleBookmark } from '../hooks/useToggleBookmark';
import bookmarkService from '../services/bookmarkService';
import { ApiError } from '../services/authService';

jest.mock('../services/bookmarkService', () => ({
  __esModule: true,
  default: { toggleBookmark: jest.fn() },
}));

const mockToggle = bookmarkService.toggleBookmark as jest.Mock;

function makeOptions(overrides: Partial<Parameters<typeof useToggleBookmark>[0]> = {}) {
  const setBookmarkedIds = jest.fn();
  const onWarning = jest.fn();
  const onLimitError = jest.fn();
  return {
    setBookmarkedIds,
    onWarning,
    onLimitError,
    options: {
      wordId: 'w1',
      progressType: 'main' as const,
      setBookmarkedIds,
      onWarning,
      onLimitError,
      ...overrides,
    },
  };
}

describe('useToggleBookmark', () => {
  beforeEach(() => jest.clearAllMocks());

  it('wordId 없으면 서비스 호출도 상태 변경도 없음', async () => {
    const { setBookmarkedIds, options } = makeOptions({ wordId: undefined });
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    expect(mockToggle).not.toHaveBeenCalled();
    expect(setBookmarkedIds).not.toHaveBeenCalled();
  });

  it('성공 시 낙관적 업데이트 1회, warning 없으면 onWarning 호출 안 함', async () => {
    mockToggle.mockResolvedValue({ success: true });
    const { setBookmarkedIds, onWarning, onLimitError, options } = makeOptions();
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    expect(mockToggle).toHaveBeenCalledWith('w1', 'main');
    expect(setBookmarkedIds).toHaveBeenCalledTimes(1);
    expect(onWarning).not.toHaveBeenCalled();
    expect(onLimitError).not.toHaveBeenCalled();
  });

  it('응답에 warning 포함 시 onWarning에 남은 개수 전달', async () => {
    mockToggle.mockResolvedValue({ success: true, warning: { remaining: 12 } });
    const { onWarning, options } = makeOptions();
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('12개'));
  });

  it('BOOKMARK_LIMIT_EXCEEDED 실패 → 롤백 + onLimitError 호출', async () => {
    mockToggle.mockRejectedValue(new ApiError('limit', 'BOOKMARK_LIMIT_EXCEEDED'));
    const { setBookmarkedIds, onLimitError, options } = makeOptions();
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    // 낙관적 업데이트 1회 + 롤백 1회 = 2회
    expect(setBookmarkedIds).toHaveBeenCalledTimes(2);
    expect(onLimitError).toHaveBeenCalledWith(expect.stringContaining('북마크가 가득'));
  });

  it('기타 에러 → 롤백만, onLimitError 호출 안 함', async () => {
    mockToggle.mockRejectedValue(new ApiError('network fail'));
    const { setBookmarkedIds, onLimitError, options } = makeOptions();
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    expect(setBookmarkedIds).toHaveBeenCalledTimes(2);
    expect(onLimitError).not.toHaveBeenCalled();
  });

  it('toggleSet: 없는 id 추가 → 있는 id 제거 (updater 함수 동작 확인)', async () => {
    mockToggle.mockResolvedValue({ success: true });
    const { setBookmarkedIds, options } = makeOptions();
    const { result } = renderHook(() => useToggleBookmark(options));

    await act(async () => { await result.current(); });

    const updater = setBookmarkedIds.mock.calls[0][0] as (prev: Set<string>) => Set<string>;
    expect(Array.from(updater(new Set()))).toEqual(['w1']);
    expect(updater(new Set(['w1'])).has('w1')).toBe(false);
  });
});
