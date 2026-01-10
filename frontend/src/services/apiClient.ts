/**
 * API Client 공통 설정
 *
 * 모든 API 요청의 기본 설정을 관리합니다.
 * - 인증 헤더 자동 추가
 * - 공통 에러 처리
 * - 타임아웃 설정
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthHeaders, handleApiError, logout } from './authService';
import { triggerAuthBanner } from 'contexts/authBannerInstance';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 인증 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();

    if (authHeaders.Authorization) {
      config.headers.Authorization = authHeaders.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 공통 에러 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 성공 응답은 그대로 반환
    return response;
  },
  (error: AxiosError) => {
    // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
    if (error.response?.status === 401) {
      console.error('인증 오류: 세션이 만료되었습니다');

      // Show banner immediately
      triggerAuthBanner();

      // Clear localStorage (skip redirect, banner handles it)
      logout(true);

      // Stop the promise chain by returning a promise that never resolves.
      // This prevents the error from being handled again downstream.
      return new Promise(() => {});
    }

    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.error('권한 오류: 이 작업을 수행할 권한이 없습니다');
    }

    // 500 Server Error
    if (error.response?.status && error.response.status >= 500) {
      console.error('서버 오류: 잠시 후 다시 시도해주세요');
    }

    return Promise.reject(error);
  }
);

/**
 * 공통 API 요청 래퍼 함수
 */
export const api = {
  /**
   * GET 요청
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * POST 요청
   */
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * PUT 요청
   */
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * DELETE 요청
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default apiClient;
