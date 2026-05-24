import DefaultButton from 'components/CommonStyled/DefaultButton';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from 'store/modules/user';
import { clsx } from 'clsx';
import * as styles from './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileData = localStorage.getItem('user');
  const userProfile = profileData ? JSON.parse(profileData) : null;

  const handleOnClick = useCallback((path: string) => {
    navigate(`/${path}`);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch(clearUser());
    setShowUserMenu(false);
    navigate('/login');
  }, [navigate, dispatch]);

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
    if (!userProfile) setShowUserMenu(false);
  }, [userProfile]);

  return (
    <div className={styles.navbar}>
      <DefaultButton className={styles.navBtn} onClick={() => handleOnClick('')}>홈</DefaultButton>
      {userProfile ? (
        <div ref={menuRef} className={styles.dropdown}>
          <DefaultButton
            className={clsx(styles.navBtn, showUserMenu && styles.navBtnActive)}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {userProfile.name}
          </DefaultButton>
          {showUserMenu && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownItem} onClick={() => handleOnClick('profile')}>프로필</div>
              <div className={styles.dropdownItem} onClick={() => handleOnClick('bookmark')}>북마크</div>
              <div className={styles.dropdownItem} onClick={handleLogout}>로그아웃</div>
            </div>
          )}
        </div>
      ) : (
        <DefaultButton className={styles.navBtn} onClick={() => handleOnClick('login')}>로그인</DefaultButton>
      )}
    </div>
  );
};

export default Navbar;
