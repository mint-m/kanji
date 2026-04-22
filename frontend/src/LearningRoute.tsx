import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isTokenExpired, logout } from './services/authService';
import { triggerAuthBanner } from './contexts/authBannerInstance';

const LearningRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  const expired = Boolean(token && userData && isTokenExpired(token));

  useEffect(() => {
    if (expired) {
      logout(true);
      triggerAuthBanner();
    }
  }, [expired]);

  if (!token || !userData || expired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default LearningRoute;
