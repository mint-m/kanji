import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginWithKakaoCode, linkKakaoAccount, toUserState, getUserLocally, saveUserLocally } from 'services/authService';
import { setUser } from 'store/modules/user';

const KAKAO_REDIRECT_URI = process.env['REACT_APP_KAKAO_REDIRECT_URI']!;

const KakaoOAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // 'link' or null

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    if (state === 'link') {
      linkKakaoAccount(code, KAKAO_REDIRECT_URI)
        .then((authProviders) => {
          const stored = getUserLocally();
          if (stored) {
            stored.authProviders = authProviders;
            saveUserLocally(stored);
          }
          navigate('/profile', { replace: true });
        })
        .catch(() => navigate('/profile', { replace: true }));
    } else {
      loginWithKakaoCode(code, KAKAO_REDIRECT_URI)
        .then((res) => {
          dispatch(setUser(toUserState(res.user)));
          navigate('/', { replace: true });
        })
        .catch(() => navigate('/login', { replace: true }));
    }
  }, [navigate, dispatch]);

  return <div style={{ textAlign: 'center', padding: '2rem' }}>카카오 처리 중...</div>;
};

export default KakaoOAuthCallback;
