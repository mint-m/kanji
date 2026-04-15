import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "./services/authService";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!user || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
