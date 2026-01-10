import React, { useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import styled from 'styled-components';
import { setAuthBannerTrigger } from './authBannerInstance';

export const AuthBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showBanner, setShowBanner] = useState(false);
  const isTriggeredRef = useRef(false);

  const showSessionExpiredBanner = useCallback(() => {
    if (isTriggeredRef.current) return; // Prevent multiple triggers
    isTriggeredRef.current = true;
    setShowBanner(true);
  }, []);

  // Register global trigger for axios interceptor
  useEffect(() => {
    setAuthBannerTrigger(showSessionExpiredBanner);
    return () => setAuthBannerTrigger(() => {});
  }, [showSessionExpiredBanner]);

  return (
    <>
      {children}
      {showBanner && <SessionExpiredBanner />}
    </>
  );
};

// Internal banner component
const SessionExpiredBanner: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/login';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BannerContainer>
      <BannerIcon>⚠️</BannerIcon>
      <BannerMessage>세션이 만료되었습니다. 로그인 페이지로 이동합니다.</BannerMessage>
    </BannerContainer>
  );
};

// Styled components (reuse FlashCardContainer ErrorBanner pattern)
const BannerContainer = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;

  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const BannerIcon = styled.span`
  font-size: 1.25rem;
`;

const BannerMessage = styled.span`
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 500;
`;
