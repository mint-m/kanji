process.env.REACT_APP_KAKAO_REST_API_KEY = 'rest-key';
process.env.REACT_APP_KAKAO_REDIRECT_URI = 'http://localhost/auth/kakao/callback';
const { startKakaoAuth, consumeKakaoState } = require('../services/kakaoOAuth');

export {};

const setHref = () => {
  delete (window as any).location;
  (window as any).location = { href: '' };
};

describe('kakaoOAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setHref();
  });

  it('startKakaoAuth: 무작위 state를 탭에 저장하고 같은 state로 인가 페이지에 보낸다', () => {
    startKakaoAuth('link');

    const saved = JSON.parse(sessionStorage.getItem('kakao_oauth_state')!);
    expect(saved.mode).toBe('link');
    expect(saved.state).toMatch(/^[0-9a-f]{32}$/);
    const url = new URL(window.location.href);
    expect(url.origin).toBe('https://kauth.kakao.com');
    expect(url.searchParams.get('state')).toBe(saved.state);
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/auth/kakao/callback');
  });

  it('startKakaoAuth: 호출마다 다른 state', () => {
    startKakaoAuth('login');
    const first = JSON.parse(sessionStorage.getItem('kakao_oauth_state')!).state;
    startKakaoAuth('login');
    expect(JSON.parse(sessionStorage.getItem('kakao_oauth_state')!).state).not.toBe(first);
  });

  it('consumeKakaoState: 일치하면 모드를 돌려주고, 한 번 쓰면 지운다', () => {
    sessionStorage.setItem('kakao_oauth_state', JSON.stringify({ state: 'abc', mode: 'login' }));
    expect(consumeKakaoState('abc')).toBe('login');
    expect(consumeKakaoState('abc')).toBeNull();
  });

  it('consumeKakaoState: 저장된 값이 없거나 다르면 null', () => {
    expect(consumeKakaoState('abc')).toBeNull();
    sessionStorage.setItem('kakao_oauth_state', JSON.stringify({ state: 'abc', mode: 'link' }));
    expect(consumeKakaoState('link')).toBeNull();
    sessionStorage.setItem('kakao_oauth_state', 'not-json');
    expect(consumeKakaoState('abc')).toBeNull();
  });
});
