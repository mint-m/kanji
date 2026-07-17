import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getTokenLocally, getUserLocally, isTokenExpired, logout, refreshTokenIfNeeded } from './services/authService';
import { useAuthBanner } from './contexts/AuthBannerContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { show } = useAuthBanner();
  const token = getTokenLocally();
  const user = getUserLocally();
  const hasToken = Boolean(token);
  const hasUser = Boolean(user);
  const isExpired = Boolean(token && user && isTokenExpired(token));

  useEffect(() => {
    if (isExpired) {
      logout(true);
      show();
      return;
    }
    if (hasToken && hasUser) {
      refreshTokenIfNeeded();
    }
  }, [isExpired, show, hasToken, hasUser]);

  if (!token || !user || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
