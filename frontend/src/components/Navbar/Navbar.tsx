import { useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { logout } from 'services/authService';
import { clsx } from 'clsx';
import type { RootState } from 'store';
import * as styles from './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const name = useSelector((state: RootState) => state.user.name);
  const isHome = pathname === '/';

  const handleOnClick = useCallback((path: string) => {
    navigate(`/${path}`);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout(true);
    setShowUserMenu(false);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) setShowUserMenu(false);
  }, [isLoggedIn]);

  return (
    <div className={styles.navbar}>
      {!isHome && <button className={styles.navBtn} onClick={() => handleOnClick('')}>홈</button>}
      {isLoggedIn ? (
        <div ref={menuRef} className={styles.dropdown}>
          <button
            className={clsx(styles.navBtn, showUserMenu && styles.navBtnActive)}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {name}
            <svg
              className={clsx(styles.chevron, showUserMenu && styles.chevronOpen)}
              width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showUserMenu && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownItem} onClick={() => handleOnClick('profile')}>프로필</div>
              <div className={styles.dropdownItem} onClick={() => handleOnClick('dashboard')}>진도</div>
              <div className={styles.dropdownItem} onClick={() => handleOnClick('bookmark')}>북마크</div>
              <div className={styles.divider} />
              <div className={clsx(styles.dropdownItem, styles.dropdownLogout)} onClick={handleLogout}>로그아웃</div>
            </div>
          )}
        </div>
      ) : (
        <button className={styles.navBtn} onClick={() => handleOnClick('login')}>로그인</button>
      )}
    </div>
  );
};

export default Navbar;
