import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  isLoggedIn: boolean;
  loginStatusType: 'google' | 'kakao' | 'local' | null;
  email: string | null;
  name?: string;
  activeProgressType: 'main' | 'sub' | null;
}

const initialState: UserState = {
  isLoggedIn: false,
  loginStatusType: null,
  email: null,
  activeProgressType: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<UserState>>) => {
      Object.assign(state, action.payload);
      state.isLoggedIn = true;
    },
    clearUser: () => initialState,
    setActiveProgressType: (state, action: PayloadAction<'main' | 'sub' | null>) => {
      state.activeProgressType = action.payload;
    },
  },
});

export const { setUser, clearUser, setActiveProgressType } = userSlice.actions;
export default userSlice.reducer;
