import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  width: '100%',
});

export const titleGroup = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
});

export const title = style({
  fontSize: vars.fontSize.xxl,
  fontWeight: 300,
});

export const subtitle = style({
  fontSize: vars.fontSize.lg,
});

export const progress = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  fontWeight: 500,
});
