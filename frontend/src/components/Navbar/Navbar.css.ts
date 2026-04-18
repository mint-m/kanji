import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const navbar = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  top: '1vh',
  right: '1.5vh',
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
  color: '#6b7280',
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
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  zIndex: 100,
});

export const dropdownItem = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#333',

  selectors: {
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
});

export const navBtnActive = style({
  backgroundColor: '#f0f0f0',
});
