import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginWithKakaoCode, toUserState } from 'services/authService';
import { setUser } from 'store/modules/user';

const KAKAO_REDIRECT_URI = process.env['REACT_APP_KAKAO_REDIRECT_URI']!;

const KakaoOAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    loginWithKakaoCode(code, KAKAO_REDIRECT_URI)
      .then((res) => {
        dispatch(setUser(toUserState(res.user)));
        navigate('/', { replace: true });
      })
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate, dispatch]);

  return <div style={{ textAlign: 'center', padding: '2rem' }}>카카오 로그인 처리 중...</div>;
};

export default KakaoOAuthCallback;
