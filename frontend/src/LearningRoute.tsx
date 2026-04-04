import React from 'react';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from './services/authService';

const LearningRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default LearningRoute;
