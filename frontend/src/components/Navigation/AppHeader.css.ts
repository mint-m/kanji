import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from 'styles/vars.css';

// 페이지 위에 겹치지 않는 고정 상단 바 — 예전 절대 위치 버튼은 모바일에서 페이지 제목과 겹쳤다
export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.lg,
  height: vars.layout.header,
  padding: `0 ${vars.space.lg}`,
  backgroundColor: vars.color.bg,
  boxShadow: '0 1px 0 rgba(163,177,198,0.35)',

  '@media': {
    [MOBILE]: { padding: `0 ${vars.space.md}` },
  },
});

export const brand = style({
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '1.1rem',
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: vars.color.textDark,
  textDecoration: 'none',
  paddingBottom: '2px',
  borderBottom: '2px solid currentColor',
  lineHeight: 1.1,
});

export const nav = style({
  display: 'flex',
  gap: vars.space.xs,

  '@media': {
    [MOBILE]: { display: 'none' },
  },
});

export const navLink = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  textDecoration: 'none',
  transition: 'color 0.15s, box-shadow 0.15s',

  selectors: {
    '&:hover': { color: vars.color.textDark },
    '&[aria-current="page"]': { color: vars.color.textDark, boxShadow: vars.shadow.pressed },
  },
});

export const right = style({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
});

export const loginLink = style([navLink, {
  boxShadow: vars.shadow.soft,
}]);
