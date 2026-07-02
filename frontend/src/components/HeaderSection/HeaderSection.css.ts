import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  width: '100%',
  gap: vars.space.md,
});

export const titleGroup = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 400,
  lineHeight: 1,
  color: vars.color.textDark,
});

export const subtitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const progress = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  fontWeight: 500,
  letterSpacing: '0.02em',
  fontVariantNumeric: 'tabular-nums',
});
