import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return localStorage.getItem("user") ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;