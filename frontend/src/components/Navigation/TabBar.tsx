import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { NAV_ITEMS, isNavActive } from './navItems';
import * as styles from './TabBar.css';

// 카드를 넘기는 학습 화면에서는 탭바를 숨겨 카드와 응답 버튼에 공간을 준다
const FOCUS_ROUTES = ['/study', '/review', '/bookmarks/study'];

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
