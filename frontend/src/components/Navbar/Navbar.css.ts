import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const SOFT = vars.shadow.soft;
const PRESSED = vars.shadow.pressed;
const HOVER = '0 3px 10px rgba(163,177,198,0.45)';

export const navbar = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  top: vars.space.md,
  right: vars.space.lg,
  zIndex: 50,
});

// 정돈된 소프트 pill
export const navBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  height: '38px',
  padding: `0 ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textMuted,
  backgroundColor: vars.color.bg,
  boxShadow: SOFT,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'box-shadow 0.15s, color 0.15s',

  selectors: {
    '&:hover': { boxShadow: HOVER, color: vars.color.textDark },
    '&:active': { boxShadow: PRESSED },
  },
});

// 드롭다운 열림 — 눌린 상태로 표시
export const navBtnActive = style({
  boxShadow: PRESSED,
  color: vars.color.textDark,

  selectors: {
    '&:hover': { boxShadow: PRESSED },
  },
});

export const chevron = style({
  display: 'block',
  flexShrink: 0,
  transition: 'transform 0.15s',
});

export const chevronOpen = style({
  transform: 'rotate(180deg)',
});

export const dropdown = style({
  position: 'relative',
  display: 'inline-block',
});

export const dropdownMenu = style({
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  minWidth: '148px',
  padding: vars.space.xs,
  backgroundColor: vars.color.white,
  borderRadius: vars.radius.lg,
  boxShadow: '0 6px 20px rgba(163,177,198,0.5)',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
});

export const dropdownItem = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textDark,
  transition: 'background-color 0.12s',

  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceLight },
  },
});

// 로그아웃 구분선 + danger (유일한 색 강조)
export const divider = style({
  height: '1px',
  backgroundColor: vars.color.borderLight,
  margin: `${vars.space.xs} ${vars.space.sm}`,
});

export const dropdownLogout = style({
  color: vars.color.danger,
});
