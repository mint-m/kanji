import { api } from './apiClient';
import { ApiResponse, ProgressType, LearningLevel } from './types';

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

export interface GetBookmarksOptions {
  level?: LearningLevel;
  progressType?: ProgressType;
  sortBy?: 'recent' | 'level' | 'step';
  page?: number;
  limit?: number;
}

export interface BookmarkPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface BookmarkListData {
  bookmarks: Bookmark[];
  pagination: BookmarkPagination;
}

const bookmarkService = {
  async toggleBookmark(wordId: string, progressType?: ProgressType): Promise<ApiResponse<Bookmark>> {
    return api.post('/api/users/me/bookmarks/toggle', { wordId, progressType });
  },

  async getBookmarks(options?: GetBookmarksOptions): Promise<ApiResponse<BookmarkListData>> {
    const params = new URLSearchParams();
    if (options?.level) params.append('level', options.level);
    if (options?.progressType) params.append('progressType', options.progressType);
    if (options?.sortBy) {
      const sortMap: Record<string, string> = { recent: 'last_studied_at', level: 'level', step: 'step' };
      params.append('sortBy', sortMap[options.sortBy] ?? options.sortBy);
    }
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/api/users/me/bookmarks?${queryString}` : '/api/users/me/bookmarks';
    return api.get(url);
  },

  async getBookmarkStats(): Promise<ApiResponse<any>> {
    return api.get('/api/users/me/bookmarks/stats');
  },

  async updateBookmarkNotes(wordId: string, notes: string): Promise<ApiResponse<Bookmark>> {
    return api.put(`/api/users/me/bookmarks/${wordId}`, { reason: notes });
  },
};

export default bookmarkService;
