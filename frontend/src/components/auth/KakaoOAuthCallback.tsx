import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginWithKakaoCode, linkKakaoAccount, toUserState, getUserLocally, saveUserLocally } from 'services/authService';
import { consumeKakaoState, KAKAO_REDIRECT_URI } from 'services/kakaoOAuth';
import { setUser } from 'store/modules/user';

const KakaoOAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const mode = consumeKakaoState(params.get('state'));

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    // 이 탭에서 시작하지 않은 콜백(외부에서 만든 링크 등)은 코드를 서버에 보내지 않는다
    if (!mode) {
      const message = '카카오 인증 요청을 확인하지 못했어요. 다시 시도해주세요.';
      if (getUserLocally()) navigate('/profile', { replace: true, state: { linkError: message } });
      else navigate('/login', { replace: true, state: { error: message } });
      return;
    }

    if (mode === 'link') {
      linkKakaoAccount(code, KAKAO_REDIRECT_URI)
        .then((authProviders) => {
          const stored = getUserLocally();
          if (stored) {
            stored.authProviders = authProviders;
            saveUserLocally(stored);
          }
          navigate('/profile', { replace: true });
        })
        .catch(() => navigate('/profile', { replace: true, state: { linkError: '카카오 계정 연동에 실패했습니다.' } }));
    } else {
      loginWithKakaoCode(code, KAKAO_REDIRECT_URI)
        .then((res) => {
          dispatch(setUser(toUserState(res.user)));
          navigate('/', { replace: true });
        })
        .catch(() => navigate('/login', { replace: true, state: { error: '카카오 로그인에 실패했습니다.' } }));
    }
  }, [navigate, dispatch]);

  return <div style={{ textAlign: 'center', padding: '2rem' }}>카카오 처리 중...</div>;
};

export default KakaoOAuthCallback;
