import { Action, createAction, handleActions } from "redux-actions";

interface UserState {
  isLoggin: boolean;
  loginStatusType: "google" | "kakao" | "local" | null;
  email: string | null;
  learningCheckpoint: CheckPoint;
  name?: string;
}

interface CheckPoint {
  level: string;
  step: number;
}

// actionType
export const userActionTypes = {
  setUser: "user/SET_USER",
  setLearningCheckpoint: "user/SET_LEANINGCHECKPOINT",
  setLevelCheckpoint: "user/SET_LEVELCHECKPOINT",
  setStepCheckpoint: "user/SET_SETCHECKPOINT",
} as const;

// action
export const setUser = createAction<UserState>(userActionTypes.setUser);
export const setLearningCheckpoint = createAction<CheckPoint>(
  userActionTypes.setLearningCheckpoint
);
export const setLevelCheckpoint = createAction<string>(
  userActionTypes.setLearningCheckpoint
);
export const setStepCheckpoint = createAction<number>(
  userActionTypes.setLearningCheckpoint
);

const initialState: UserState = {
  isLoggin: false,
  loginStatusType: null,
  email: null,
  learningCheckpoint: { level: "5", step: 1 },
};

// reducer
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
    [userActionTypes.setStepCheckpoint]: (state, action: Action<number>) => ({
      ...state,
      learningCheckpoint: {
        ...state.learningCheckpoint,
        step: action.payload,
      },
    }),
  },
  initialState
);

export default userReducer;
