/**
 * Bookmark Service
 *
 * 북마크 관리 API
 * - 북마크 추가/제거
 * - 북마크 목록 조회
 * - 북마크 통계 조회
 */

import { api } from './apiClient';
import { ApiResponse, ProgressType, LearningLevel } from './types';

// 북마크 데이터
export interface Bookmark {
  _id: string;
  user_id: string;
  word_id: string;
  word: {
    _id: string;
    origin_entry_id: string;
    entry: string;
    pron?: string;
    level: LearningLevel;
    step: number;
    means: string[];
    parts: string[];
  };
  progress_type?: ProgressType;
  is_bookmarked: boolean;
  bookmarked_at: string;
  notes?: string;
}

// 북마크 목록 조회 옵션
export interface GetBookmarksOptions {
  level?: LearningLevel;
  progressType?: ProgressType;
  sortBy?: 'recent' | 'level' | 'step';
  limit?: number;
}

const bookmarkService = {
  /**
   * 북마크 추가
   *
   * @param wordId - 단어 ID
   * @param progressType - 세션 타입 (optional)
   * @param notes - 메모 (optional)
   */
  async addBookmark(
    wordId: string,
    progressType?: ProgressType,
    notes?: string
  ): Promise<ApiResponse<Bookmark>> {
    return api.post('/api/users/me/bookmarks', {
      wordId,
      progressType,
      notes,
    });
  },

  /**
   * 북마크 제거
   *
   * @param wordId - 단어 ID
   */
  async removeBookmark(wordId: string): Promise<ApiResponse<any>> {
    return api.delete(`/api/bookmarks/${wordId}`);
  },

  /**
   * 북마크 토글 (추가/제거)
   *
   * @param wordId - 단어 ID
   * @param progressType - 세션 타입 (optional)
   */
  async toggleBookmark(wordId: string, progressType?: ProgressType): Promise<ApiResponse<Bookmark>> {
    return api.post('/api/users/me/bookmarks/toggle', {
      wordId,
      progressType,
    });
  },

  /**
   * 북마크 목록 조회
   *
   * @param options - 필터 옵션 (level, progressType, sortBy, limit)
   *
   * 예시:
   * ```
   * // N5 레벨의 북마크만 조회
   * await bookmarkService.getBookmarks({ level: 'N5', limit: 50 });
   *
   * // main 세션의 북마크만 조회
   * await bookmarkService.getBookmarks({ progressType: 'main' });
   * ```
   */
  async getBookmarks(options?: GetBookmarksOptions): Promise<ApiResponse<Bookmark[]>> {
    const params = new URLSearchParams();

    if (options?.level) params.append('level', options.level);
    if (options?.progressType) params.append('progressType', options.progressType);
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/api/bookmarks?${queryString}` : '/api/users/me/bookmarks';

    return api.get(url);
  },

  /**
   * 특정 단어의 북마크 상태 조회
   *
   * @param wordId - 단어 ID
   */
  async getBookmarkStatus(wordId: string): Promise<ApiResponse<{ isBookmarked: boolean; bookmark?: Bookmark }>> {
    return api.get(`/api/bookmarks/${wordId}/status`);
  },

  /**
   * 북마크 통계 조회
   *
   * - 총 북마크 수
   * - 레벨별 분포
   * - 최근 북마크 단어
   */
  async getBookmarkStats(): Promise<ApiResponse<any>> {
    return api.get('/api/users/me/bookmarks/stats');
  },

  /**
   * 북마크 메모 업데이트
   *
   * @param wordId - 단어 ID
   * @param notes - 메모 내용
   */
  async updateBookmarkNotes(wordId: string, notes: string): Promise<ApiResponse<Bookmark>> {
    return api.put(`/api/bookmarks/${wordId}/notes`, { notes });
  },

  /**
   * 여러 북마크 일괄 삭제
   *
   * @param wordIds - 단어 ID 배열
   */
  async bulkRemoveBookmarks(wordIds: string[]): Promise<ApiResponse<any>> {
    return api.post('/api/users/me/bookmarks/bulk-remove', { wordIds });
  },
};

export default bookmarkService;
