import userReducer, { setUser, clearUser, setActiveProgressType } from '../store/modules/user';

const initialState = {
  isLoggedIn: false,
  loginStatusType: null,
  email: null,
  name: undefined,
  activeProgressType: null,
};

describe('userSlice', () => {
  it('초기 상태 반환', () => {
    expect(userReducer(undefined, { type: '' })).toEqual(initialState);
  });

  describe('setUser', () => {
    it('isLoggedIn: true 및 유저 정보 세팅', () => {
      const state = userReducer(undefined, setUser({
        loginStatusType: 'google',
        email: 'test@example.com',
        name: '테스트',
        activeProgressType: 'main',
      }));
      expect(state.isLoggedIn).toBe(true);
      expect(state.email).toBe('test@example.com');
      expect(state.loginStatusType).toBe('google');
      expect(state.activeProgressType).toBe('main');
    });

    it('kakao 로그인 타입 처리', () => {
      const state = userReducer(undefined, setUser({ loginStatusType: 'kakao', email: 'k@kakao.com' }));
      expect(state.isLoggedIn).toBe(true);
      expect(state.loginStatusType).toBe('kakao');
    });

    it('activeProgressType null 허용', () => {
      const state = userReducer(undefined, setUser({ activeProgressType: null }));
      expect(state.activeProgressType).toBeNull();
    });

    it('부분 업데이트: name만 변경', () => {
      const prev = { ...initialState, isLoggedIn: true, email: 'a@b.com' };
      const state = userReducer(prev, setUser({ name: '변경된이름' }));
      expect(state.name).toBe('변경된이름');
      expect(state.email).toBe('a@b.com');
      expect(state.isLoggedIn).toBe(true);
    });
  });

  describe('clearUser', () => {
    it('로그인 상태에서 초기 상태로 복원', () => {
      const loggedIn = {
        isLoggedIn: true,
        loginStatusType: 'google' as const,
        email: 'test@example.com',
        name: '테스트',
        activeProgressType: 'main' as const,
      };
      const state = userReducer(loggedIn, clearUser());
      expect(state).toEqual(initialState);
    });
  });

  describe('setActiveProgressType', () => {
    it('main → sub 변경', () => {
      const prev = { ...initialState, isLoggedIn: true, activeProgressType: 'main' as const };
      const state = userReducer(prev, setActiveProgressType('sub'));
      expect(state.activeProgressType).toBe('sub');
    });

    it('null로 변경', () => {
      const prev = { ...initialState, activeProgressType: 'main' as const };
      const state = userReducer(prev, setActiveProgressType(null));
      expect(state.activeProgressType).toBeNull();
    });
  });
});
