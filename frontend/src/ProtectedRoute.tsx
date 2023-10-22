import React from "react";
import loginCheck from "components/auth/loginCheck";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isLogin = loginCheck();
    return !isLogin ? <Navigate to="/login" replace /> : children;
};

export default ProtectedRoute;