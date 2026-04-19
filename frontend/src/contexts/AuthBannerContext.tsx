import { FC, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthBannerTrigger } from './authBannerInstance';
import * as styles from './AuthBannerContext.css';

export const AuthBannerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setAuthBannerTrigger(() => setShowBanner(true));
    return () => setAuthBannerTrigger(() => { });
  }, []);

  return (
    <>
      {children}
      {showBanner && <SessionExpiredBanner onHide={() => setShowBanner(false)} />}
    </>
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
