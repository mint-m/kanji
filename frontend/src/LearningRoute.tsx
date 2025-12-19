import React from 'react';
import { Navigate } from 'react-router-dom';

const LearningRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  // 인증 체크
  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  // 모든 체크 통과 - 자식 컴포넌트 렌더링
  return children;
};

export default LearningRoute;