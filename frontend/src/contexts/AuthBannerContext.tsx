import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { setAuthBannerTrigger } from './authBannerInstance';

export const AuthBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showBanner, setShowBanner] = useState(false);

  const showSessionExpiredBanner = useCallback(() => {
    setShowBanner(true); // React skips re-render if already true
  }, []);

  const hideBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Register global trigger for axios interceptor
  useEffect(() => {
    setAuthBannerTrigger(showSessionExpiredBanner);
    return () => setAuthBannerTrigger(() => { });
  }, [showSessionExpiredBanner]);

  return (
    <>
      {children}
      {showBanner && <SessionExpiredBanner onHide={hideBanner} />}
    </>
  );
};

// Internal banner component
const SessionExpiredBanner: React.FC<{ onHide: () => void }> = ({ onHide }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onHide(); // Hide banner before navigation
      navigate('/login', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, onHide]);

  return (
    <BannerContainer>
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
  background: rgba(118, 180, 255, 0.20); /* Added transparency */
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  
  backdrop-filter: blur(8px); // Glass effect
  box-shadow: 0 4px 12px rgba(118, 180, 255, 0.25);

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

const BannerMessage = styled.span`
  color: #1E2A44;
  font-size: 0.9rem;
  font-weight: 500;
`;
