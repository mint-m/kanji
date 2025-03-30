import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'store';

// LearningRoute는 학습 관련 페이지에 접근할 때 
// 사용자 인증 및 학습 체크포인트를 확인하는 컴포넌트입니다.
const LearningRoute = ({ children }: { children: JSX.Element }) => {
  const user = useSelector((state: RootState) => state.user);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  
  useEffect(() => {
    // 토큰 및 사용자 정보 체크
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      // 로그인 되어 있지 않으면 로그인 페이지로 리다이렉트
      setShouldRedirect('/login');
      return;
    }
    
    // 로그인은 되어 있지만 학습 체크포인트가 없는 경우
    if (!user.learningCheckpoint || !user.learningCheckpoint.level) {
      // 레벨 선택 페이지로 리다이렉트
      setShouldRedirect('/select-level');
      return;
    }
    
    // 모든 조건을 통과하면 정상적으로 자식 컴포넌트 렌더링
    setShouldRedirect(null);
  }, [user]);
  
  // 리다이렉션이 필요한 경우
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }
  
  // 모든 체크를 통과하면 자식 컴포넌트 렌더링
  return children;
};

export default LearningRoute;