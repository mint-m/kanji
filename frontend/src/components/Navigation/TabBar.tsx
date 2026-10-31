import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { FOCUS_ROUTES, NAV_ITEMS, isNavActive } from './navItems';
import * as styles from './TabBar.css';

const TabBar = () => {
  const { pathname } = useLocation();
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);

  if (!isLoggedIn || FOCUS_ROUTES.includes(pathname)) return null;

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={styles.tabBar} aria-label="하단 메뉴">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={styles.tab}
            aria-current={isNavActive(item, pathname) ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default TabBar;
