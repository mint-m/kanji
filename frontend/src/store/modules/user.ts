import { Action, createAction, handleActions } from 'redux-actions';

interface UserState {
  isLoggin: boolean;
  loginStatusType: 'google' | 'kakao' | 'local' | null;
  email: string | null;
  name?: string;
  activeProgressType: 'main' | 'sub' | null;
}

// actionType
export const userActionTypes = {
  setUser: 'user/SET_USER',
  setActiveProgressType: 'user/SET_ACTIVE_PROGRESS_TYPE',
} as const;

// action
export const setUser = createAction<UserState>(userActionTypes.setUser);
export const setActiveProgressType = createAction<'main' | 'sub' | null>(userActionTypes.setActiveProgressType);

const initialState: UserState = {
  isLoggin: false,
  loginStatusType: null,
  email: null,
  activeProgressType: null,
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
  },
  initialState
);

export default userReducer;
