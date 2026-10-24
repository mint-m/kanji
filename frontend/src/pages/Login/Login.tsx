import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from 'store';
import Landing from 'pages/Main/Landing';

// 로그인 화면은 서비스 소개와 같은 화면 — 로그인 중이면 홈으로
const Login = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const errorMessage = (useLocation().state as { error?: string } | null)?.error;

  if (isLoggedIn) return <Navigate to="/" replace />;
  return <Landing error={errorMessage} />;
};

export default Login;
