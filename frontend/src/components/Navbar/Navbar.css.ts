import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const navbar = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  top: '1vh',
  right: '1.5vh',
  zIndex: 50,
});

export const navBtn = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '64px',
  height: '40px',
  fontSize: vars.fontSize.sm,
  borderRadius: vars.radius.round,
  padding: `0 ${vars.space.md}`,
  marginLeft: vars.space.md,
  color: vars.color.navText,
});

export const dropdown = style({
  position: 'relative',
  display: 'inline-block',
});

export const dropdownMenu = style({
  position: 'absolute',
  right: 0,
  top: '48px',
  width: '128px',
  backgroundColor: vars.color.white,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.dropdown,
  overflow: 'hidden',
  zIndex: 100,
});

export const dropdownItem = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  cursor: 'pointer',
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,

  selectors: {
    '&:hover': {
      backgroundColor: vars.color.surfaceLight,
    },
  },
});

export const navBtnActive = style({
  backgroundColor: vars.color.navActiveBg,
});
