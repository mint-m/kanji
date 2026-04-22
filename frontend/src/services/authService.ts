// src/services/authService.ts
import axios, { AxiosError } from 'axios';
import store from 'store';
import { clearUser } from 'store/modules/user';

// 환경 변수에서 API URL 가져오기 (빈 문자열이면 상대 경로 사용)
export const GOOGLE_REDIRECT_URI = process.env['REACT_APP_GOOGLE_REDIRECT_URI'] as string;

// 사용자 정보 타입 정의
export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  type: 'google' | 'kakao' | 'local';
  profile?: {
    displayName?: string;
    profilePicture?: string;
    bio?: string;
    studyGoals?: string[];
    joinedAt?: Date;
    lastActiveAt?: Date;
    daysSinceJoined?: number;
  };
  preferences?: {
    studyReminders?: boolean;
    reminderTime?: string;
    dailyGoal?: number;
    theme?: 'light' | 'dark' | 'auto';
    language?: 'ko' | 'en' | 'ja';
    soundEffects?: boolean;
    autoPlayAudio?: boolean;
  };
  statistics?: {
    totalWordsStudied?: number;
    totalTimeSpent?: number;
    currentStreak?: number;
    longestStreak?: number;
    levelsCompleted?: string[];
    averageSessionTime?: number;
    studyDaysCount?: number;
    favoriteStudyTime?: string;
  };
  authInfo?: {
    lastActive?: Date;
    isVerified?: boolean;
    accountType?: string;
    isNewUser?: boolean;
    canReceiveReminders?: boolean;
    hasLearningCheckpoint?: boolean;
  };
  learningStats?: any;
  [key: string]: any; // 추가 필드를 위한 인덱스 시그니처
}

// 로그인 응답 타입 정의
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

// 토큰 관리 함수들
export const saveTokenLocally = (token: string): void => {
  localStorage.setItem('token', token);
};

export const getTokenLocally = (): string | null => {
  return localStorage.getItem('token');
};

export const removeTokenLocally = (): void => {
  localStorage.removeItem('token');
};

// 사용자 정보 관리 함수들
export const saveUserLocally = (user: UserProfile): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserLocally = (): UserProfile | null => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const removeUserLocally = (): void => {
  localStorage.removeItem('user');
};

// API 호출에 사용할 공통 헤더 생성
export const getAuthHeaders = (token = getTokenLocally()): Record<string, string> => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 공통 에러 핸들링
export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'Unknown API error';

    // 401 handling is done in apiClient interceptor
    // No need to handle it here (prevents duplication)

    throw new Error(errorMessage);
  }

  throw error instanceof Error ? error : new Error('Unknown error occurred');
};

// API 요청 함수들
export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string = GOOGLE_REDIRECT_URI
): Promise<{ accessToken: string; idToken?: string }> => {
  try {
    const response = await axios.post(`/api/auth/google/access-token`, {
      code,
      redirect_uri: redirectUri,
    });

    if (!response.data.success) {
      throw new Error('Failed to exchange code for token');
    }

    return {
      accessToken: response.data.accessToken,
      idToken: response.data.idToken,
    };
  } catch (error) {
    console.error('❌ exchangeCodeForToken error:', error);

    return handleApiError(error);
  }
};

// 사용자 프로필 가져오기 (상세 정보 포함)
export const fetchUserData = async (token: string): Promise<UserProfile & { learningStats?: any }> => {
  try {
    // 상세 프로필 정보 가져오기 (이미 통계 정보 포함)
    const profileResponse = await axios.get('/api/auth/profile', {
      headers: getAuthHeaders(token),
    });

    if (!profileResponse.data.success) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = profileResponse.data.data;

    // 학습 통계는 필요할 때 별도로 조회 (불필요한 초기 로딩 제거)

    return userData;
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginWithGoogleToken = async (accessToken: string): Promise<LoginResponse & { user?: UserProfile }> => {
  try {
    const loginResponse = await axios.post('/api/auth/google-login', {
      accessToken,
    });

    if (!loginResponse.data.success) {
      throw new Error('Google login failed');
    }

    // 토큰 저장
    const token = loginResponse.data.token;
    saveTokenLocally(token);

    // 사용자 정보 저장 (이미 응답에 포함되어 있음)
    const userProfile = loginResponse.data.user;
    saveUserLocally(userProfile);

    return {
      token: loginResponse.data.token,
      user: userProfile,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await axios.get('/api/auth/profile', {
      headers: getAuthHeaders(token),
    });

    if (!response.data.success) {
      throw new Error('Failed to fetch user profile');
    }

    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// 로그아웃 (localStorage + Redux store 동시 초기화)
export const logout = (skipRedirect = false): void => {
  removeTokenLocally();
  removeUserLocally();
  store.dispatch(clearUser()); // UI 로그아웃 상태 반영

  if (!skipRedirect) {
    window.location.href = '/';
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return !!getTokenLocally();
};

// JWT 토큰 만료 여부 확인 (디코딩만 수행, 서버 검증 아님)
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// 인증 여부에 따라 콜백 실행 (라우터 가드 등에서 사용)
export const withAuth = <T>(callback: (user: UserProfile) => T, fallback?: () => T): T => {
  const token = getTokenLocally();
  const user = getUserLocally();

  if (token && user) {
    return callback(user);
  }

  if (fallback) {
    return fallback();
  }

  // 인증 실패 시 로그인 페이지로 리다이렉트 등의 기본 동작 추가 가능
  throw new Error('Authentication required');
};
