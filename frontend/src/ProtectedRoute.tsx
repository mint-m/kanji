import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getTokenLocally, getUserLocally, isTokenExpired, logout } from './services/authService';
import { triggerAuthBanner } from './contexts/authBannerInstance';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = getTokenLocally();
  const user = getUserLocally();
  const isExpired = Boolean(token && user && isTokenExpired(token));

  useEffect(() => {
    if (isExpired) {
      logout(true);
      triggerAuthBanner();
    }
  }, [isExpired]);

  if (!token || !user || isExpired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
