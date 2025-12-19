import { Action, createAction, handleActions } from 'redux-actions';

// 레벨별 학습 통계 인터페이스
interface LevelStatistics {
  level: string;
  mastered: number;
  total: number;
  percentage: number;
}

interface UserState {
  isLoggin: boolean;
  loginStatusType: 'google' | 'kakao' | 'local' | null;
  email: string | null;
  name?: string;
  activeProgressType: 'main' | 'sub' | null;
  learningStats: LevelStatistics[];
  learningStreak: number;
}

// actionType
export const userActionTypes = {
  setUser: 'user/SET_USER',
  setActiveProgressType: 'user/SET_ACTIVE_PROGRESS_TYPE',
  setLearningStats: 'user/SET_LEARNING_STATS',
  setLearningStreak: 'user/SET_LEARNING_STREAK',
} as const;

// action
export const setUser = createAction<UserState>(userActionTypes.setUser);
export const setActiveProgressType = createAction<'main' | 'sub' | null>(userActionTypes.setActiveProgressType);
export const setLearningStats = createAction<LevelStatistics[]>(userActionTypes.setLearningStats);
export const setLearningStreak = createAction<number>(userActionTypes.setLearningStreak);

const initialState: UserState = {
  isLoggin: false,
  loginStatusType: null,
  email: null,
  activeProgressType: null,
  learningStats: [],
  learningStreak: 0,
};

const userReducer = handleActions<UserState, any>(
  {
    [userActionTypes.setUser]: (state, action: Action<UserState>) => ({
      ...state,
      ...action.payload,
      isLoggin: true,
    }),
    [userActionTypes.setActiveProgressType]: (state, action: Action<'main' | 'sub' | null>) => ({
      ...state,
      activeProgressType: action.payload,
    }),
    [userActionTypes.setLearningStats]: (state, action: Action<LevelStatistics[]>) => ({
      ...state,
      learningStats: action.payload,
    }),
    [userActionTypes.setLearningStreak]: (state, action: Action<number>) => ({
      ...state,
      learningStreak: action.payload,
    }),
  },
  initialState
);

export default userReducer;
