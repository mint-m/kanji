import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isLogin = localStorage.getItem("user");
    return !isLogin ? <Navigate to="/login" replace /> : children;
};

export default ProtectedRoute;