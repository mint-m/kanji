import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const wrapper = style({
  position: 'relative',
});

export const trigger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  height: '38px',
  maxWidth: '200px',
  padding: `0 ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.pill,
  fontFamily: 'inherit',
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  backgroundColor: vars.color.bg,
  boxShadow: vars.shadow.soft,
  cursor: 'pointer',
  whiteSpace: 'nowrap',

  selectors: {
    '&:hover': { color: vars.color.textDark },
    '&[aria-expanded="true"]': { boxShadow: vars.shadow.pressed, color: vars.color.textDark },
  },
});

export const name = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const chevron = style({
  flexShrink: 0,
  transition: 'transform 0.15s',
  selectors: {
    [`${trigger}[aria-expanded="true"] &`]: { transform: 'rotate(180deg)' },
  },
});

export const menu = style({
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

export const item = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.md,
  background: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textDark,
  cursor: 'pointer',

  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceLight },
  },
});

export const divider = style({
  height: '1px',
  backgroundColor: vars.color.borderLight,
  margin: `${vars.space.xs} ${vars.space.sm}`,
});

export const logout = style([item, {
  color: vars.color.danger,
}]);
