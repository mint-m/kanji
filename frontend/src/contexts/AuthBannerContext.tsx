import { FC, useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthBannerTrigger } from './authBannerBridge';
import * as styles from './AuthBannerContext.css';

const AuthBannerContext = createContext<{ show: () => void } | null>(null);

export const useAuthBanner = () => {
  const ctx = useContext(AuthBannerContext);
  if (!ctx) throw new Error('useAuthBanner must be used within AuthBannerProvider');
  return ctx;
};

export const AuthBannerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [showBanner, setShowBanner] = useState(false);
  const show = useCallback(() => setShowBanner(true), []);

  useEffect(() => {
    // apiClient(axios 인터셉터)는 React 트리 밖이라 훅을 쓸 수 없어 브릿지로 등록
    setAuthBannerTrigger(show);
    return () => setAuthBannerTrigger(() => {});
  }, [show]);

  return (
    <AuthBannerContext.Provider value={{ show }}>
      {children}
      {showBanner && <SessionExpiredBanner onHide={() => setShowBanner(false)} />}
    </AuthBannerContext.Provider>
  );
};

const SessionExpiredBanner: FC<{ onHide: () => void }> = ({ onHide }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
      navigate('/login', { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate, onHide]);

  return (
    <div className={styles.banner}>
      <span className={styles.bannerText}>
        세션이 만료되었습니다. 로그인 페이지로 이동합니다.
      </span>
    </div>
  );
};
