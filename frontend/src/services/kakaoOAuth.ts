const KAKAO_REST_API_KEY = process.env['REACT_APP_KAKAO_REST_API_KEY'];
export const KAKAO_REDIRECT_URI = process.env['REACT_APP_KAKAO_REDIRECT_URI'] ?? '';

const STATE_KEY = 'kakao_oauth_state';

export type KakaoAuthMode = 'login' | 'link';

const randomState = () =>
  Array.from(window.crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

// 카카오 인가 페이지로 보낸다. state는 이 탭(sessionStorage)에만 저장해 콜백에서 대조한다 —
// 남이 만든 콜백 URL(`?code=공격자 코드`)로 로그인되거나 계정이 연동되는 것(CSRF)을 막는다
export const startKakaoAuth = (mode: KakaoAuthMode): void => {
  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) return;
  const state = randomState();
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, mode }));
  window.location.href =
    'https://kauth.kakao.com/oauth/authorize' +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
    '&response_type=code' +
    '&scope=account_email,profile_nickname' +
    `&state=${state}`;
};

// 콜백의 state가 이 탭에서 시작한 요청과 같으면 그때의 모드를, 아니면 null을 돌려준다. 한 번 쓰면 지운다
export const consumeKakaoState = (state: string | null): KakaoAuthMode | null => {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!saved || !state) return null;
  try {
    const parsed = JSON.parse(saved) as { state: string; mode: KakaoAuthMode };
    return parsed.state === state ? parsed.mode : null;
  } catch {
    return null;
  }
};
