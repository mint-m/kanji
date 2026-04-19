import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isTokenExpired, logout } from "./services/authService";
import { triggerAuthBanner } from "./contexts/authBannerInstance";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const expired = Boolean(token && user && isTokenExpired(token));

  useEffect(() => {
    if (expired) {
      logout(true);
      triggerAuthBanner();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !token || expired) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
