import { Dispatch, SetStateAction, useCallback } from 'react';
import bookmarkService from 'services/bookmarkService';
import { ApiError } from 'services/authService';
import { ProgressType } from 'services/types';

interface Options {
  wordId: string | undefined;
  progressType: ProgressType | undefined;
  setBookmarkedIds: Dispatch<SetStateAction<Set<string>>>;
  onWarning: (msg: string) => void;
  onLimitError: (msg: string) => void;
}

function toggleSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export function useToggleBookmark({
  wordId,
  progressType,
  setBookmarkedIds,
  onWarning,
  onLimitError,
}: Options): () => Promise<void> {
  return useCallback(async () => {
    if (!wordId) return;

    setBookmarkedIds(prev => toggleSet(prev, wordId));

    try {
      const res = await bookmarkService.toggleBookmark(wordId, progressType);
      if (res.warning) {
        onWarning(`북마크 ${res.warning.remaining}개 남았습니다. 복습 후 정리해보세요.`);
      }
    } catch (err) {
      setBookmarkedIds(prev => toggleSet(prev, wordId));
      if (err instanceof ApiError && err.code === 'BOOKMARK_LIMIT_EXCEEDED') {
        onLimitError('북마크가 가득 찼습니다 (최대 150개). 복습 후 정리해주세요.');
      }
    }
  }, [wordId, progressType, setBookmarkedIds, onWarning, onLimitError]);
}
