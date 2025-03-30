import { Action, createAction, handleActions } from "redux-actions";

// 레벨별 학습 통계 인터페이스
interface LevelStatistics {
  level: string;
  mastered: number;
  total: number;
  percentage: number;
}

interface UserState {
  isLoggin: boolean;
  loginStatusType: "google" | "kakao" | "local" | null;
  email: string | null;
  name?: string;
  learningCheckpoint: CheckPoint;
  learningStats: LevelStatistics[];
  learningStreak: number;
}

interface CheckPoint {
  level: string;
  step: StepType;
}

interface StepType {
  min: number;
  max: number;
}

// actionType
export const userActionTypes = {
  setUser: "user/SET_USER",
  setLearningCheckpoint: "user/SET_LEANINGCHECKPOINT",
  setLevelCheckpoint: "user/SET_LEVELCHECKPOINT",
  setStepCheckpoint: "user/SET_SETCHECKPOINT",
  setLearningStats: "user/SET_LEARNING_STATS",
  setLearningStreak: "user/SET_LEARNING_STREAK",
} as const;

// action
export const setUser = createAction<UserState>(userActionTypes.setUser);
export const setLearningCheckpoint = createAction<CheckPoint>(
  userActionTypes.setLearningCheckpoint
);
export const setLevelCheckpoint = createAction<string>(
  userActionTypes.setLevelCheckpoint
);
export const setStepCheckpoint = createAction<StepType>(
  userActionTypes.setStepCheckpoint
);
export const setLearningStats = createAction<LevelStatistics[]>(
  userActionTypes.setLearningStats
);
export const setLearningStreak = createAction<number>(
  userActionTypes.setLearningStreak
);

const initialState: UserState = {
  isLoggin: false,
  loginStatusType: null,
  email: null,
  learningCheckpoint: { level: "N5", step: { min: 1, max: 1 } },
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
    [userActionTypes.setLearningCheckpoint]: (
      state,
      action: Action<CheckPoint>
    ) => ({
      ...state,
      learningCheckpoint: action.payload,
    }),
    [userActionTypes.setLevelCheckpoint]: (state, action: Action<string>) => ({
      ...state,
      learningCheckpoint: {
        ...state.learningCheckpoint,
        level: action.payload,
      },
    }),
    [userActionTypes.setStepCheckpoint]: (state, action: Action<StepType>) => ({
      ...state,
      learningCheckpoint: {
        ...state.learningCheckpoint,
        step: action.payload,
      },
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