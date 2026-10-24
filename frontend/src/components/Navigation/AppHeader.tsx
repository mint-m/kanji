import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import UserMenu from './UserMenu';
import { NAV_ITEMS, isNavActive } from './navItems';
import * as styles from './AppHeader.css';

const AppHeader = () => {
  const { pathname } = useLocation();
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="kanji 홈으로">kanji</Link>
      {isLoggedIn && (
        <nav className={styles.nav} aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={styles.navLink}
              aria-current={isNavActive(item, pathname) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <div className={styles.right}>
        {isLoggedIn ? (
          <UserMenu />
        ) : (
          pathname !== '/login' && <Link to="/login" className={styles.loginLink}>로그인</Link>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
