import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from 'styles/vars.css';

// 모바일 하단 탭 — 데스크톱에서는 상단 바의 메뉴를 쓴다
export const tabBar = style({
  display: 'none',

  '@media': {
    [MOBILE]: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: '1fr',
      height: vars.layout.tabBar,
      paddingBottom: 'env(safe-area-inset-bottom)',
      backgroundColor: vars.color.bg,
      boxShadow: '0 -1px 0 rgba(163,177,198,0.35)',
    },
  },
});

// 고정된 탭바에 마지막 내용이 가려지지 않도록 같은 높이만큼 비워 둔다
export const spacer = style({
  display: 'none',
  '@media': {
    [MOBILE]: { display: 'block', height: vars.layout.tabBar },
  },
});

export const tab = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textMuted,
  textDecoration: 'none',

  selectors: {
    '&[aria-current="page"]': { color: vars.color.primary },
  },
});
