import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthHeaders, logout } from './authService';
import { triggerAuthBanner } from 'contexts/authBannerBridge';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  // Render 무료 플랜은 15분 유휴 후 재기동에 약 1분이 걸린다 — 첫 요청이 타임아웃으로 실패하지 않도록 여유를 둔다
  timeout: 75000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      config.headers.Authorization = authHeaders.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('인증 오류: 세션이 만료되었습니다');
      triggerAuthBanner();
      logout(true);
      return Promise.reject(new AxiosError('Unauthorized', 'ERR_UNAUTHORIZED'));
    }

    if (error.response?.status === 403) {
      console.error('권한 오류: 이 작업을 수행할 권한이 없습니다');
    }

    if (error.response?.status && error.response.status >= 500) {
      console.error('서버 오류: 잠시 후 다시 시도해주세요');
    }

    return Promise.reject(error);
  }
);

// 실패 원인에 맞는 안내 문구 — 모두 "네트워크 확인"으로 묶으면 사용자 문의로 원인을 가릴 수 없다
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;
  if (error.code === 'ERR_UNAUTHORIZED') return '로그인이 만료되었어요. 다시 로그인해주세요.';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return '서버 응답이 늦어요. 잠시 후 다시 시도해주세요.';
  if (!error.response) return '서버에 연결하지 못했어요. 네트워크 연결을 확인해주세요.';
  if (error.response.status >= 500) return '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
  return fallback;
};

export const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },
};

export default apiClient;
