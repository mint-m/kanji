/**
 * Services Index
 *
 * 모든 API 서비스를 한 곳에서 export
 */

export { default as progressService } from './progressService';
export { default as deckService } from './deckService';
export { default as bookmarkService } from './bookmarkService';
export { default as apiClient, api } from './apiClient';

// Auth service는 기존 파일 사용
export * from './authService';

// Types export
export * from './types';

// Re-export service types
export type {
  GetProgressResponse,
  UpdateIndexRequest,
  LearningStatsResponse,
} from './progressService';

export type { Bookmark, GetBookmarksOptions } from './bookmarkService';
