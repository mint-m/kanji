import { ReactNode } from 'react';

export interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  // 이 메뉴를 활성으로 표시할 경로 (하위 경로 포함, '/'는 정확히 일치)
  match: string[];
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: '학습',
    match: ['/', '/flash-cards', '/start'],
    icon: <Icon><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></Icon>,
  },
  {
    to: '/bookmark',
    label: '북마크',
    match: ['/bookmark', '/bookmark-study'],
    icon: <Icon><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Icon>,
  },
  {
    to: '/dashboard',
    label: '기록',
    match: ['/dashboard', '/profile/stats'],
    icon: <Icon><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></Icon>,
  },
];

export const isNavActive = (item: NavItem, pathname: string) =>
  item.match.some((path) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)));
