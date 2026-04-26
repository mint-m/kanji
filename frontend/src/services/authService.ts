import axios, { AxiosError } from 'axios';
import store from 'store';
import { clearUser } from 'store/modules/user';

export const GOOGLE_REDIRECT_URI = process.env['REACT_APP_GOOGLE_REDIRECT_URI'] as string;

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  type: 'google' | 'kakao' | 'local';
  activeProgressType: 'main' | 'sub' | null;
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
  };
}

export interface LoginResult {
  token: string;
  user: UserProfile;
}

// Redux user state shape에 맞게 변환
export const toUserState = (user: UserProfile) => ({
  isLoggin: true as const,
  loginStatusType: user.type,
  email: user.email,
  name: user.name,
  activeProgressType: user.activeProgressType ?? null,
});

// localStorage helpers
export const saveTokenLocally = (token: string) => localStorage.setItem('token', token);
export const getTokenLocally = () => localStorage.getItem('token');
export const removeTokenLocally = () => localStorage.removeItem('token');

export const saveUserLocally = (user: UserProfile) => localStorage.setItem('user', JSON.stringify(user));
export const getUserLocally = (): UserProfile | null => {
  const data = localStorage.getItem('user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};
export const removeUserLocally = () => localStorage.removeItem('user');

export const getAuthHeaders = (token = getTokenLocally()): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'Unknown API error';
    throw new Error(errorMessage);
  }
  throw error instanceof Error ? error : new Error('Unknown error occurred');
};

const processLoginResponse = (data: { token: string; user: UserProfile }): LoginResult => {
  saveTokenLocally(data.token);
  saveUserLocally(data.user);
  return { token: data.token, user: data.user };
};

export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string = GOOGLE_REDIRECT_URI
): Promise<{ accessToken: string; idToken?: string }> => {
  try {
    const response = await axios.post('/api/auth/google/access-token', { code, redirect_uri: redirectUri });
    return { accessToken: response.data.accessToken, idToken: response.data.idToken };
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginWithGoogleToken = async (accessToken: string): Promise<LoginResult> => {
  try {
    const response = await axios.post('/api/auth/google/login', { accessToken });
    return processLoginResponse(response.data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginWithGoogleIdToken = async (credential: string): Promise<LoginResult> => {
  try {
    const response = await axios.post('/api/auth/google/one-tap', { credential });
    return processLoginResponse(response.data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const loginWithKakaoCode = async (code: string, redirectUri: string): Promise<LoginResult> => {
  try {
    const response = await axios.post('/api/auth/kakao/callback', { code, redirectUri });
    return processLoginResponse(response.data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await axios.get('/api/auth/profile', { headers: getAuthHeaders(token) });
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const logout = (skipRedirect = false): void => {
  removeTokenLocally();
  removeUserLocally();
  store.dispatch(clearUser());
  if (!skipRedirect) {
    window.location.href = '/';
  }
};

export const isAuthenticated = (): boolean => !!getTokenLocally();

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
