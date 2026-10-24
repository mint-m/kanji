import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  width: '100%',
  marginBottom: vars.space.md,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 600,
  lineHeight: 1,
  color: vars.color.textDark,
});

export const subtitle = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textMuted,
});

export const counter = style({
  marginLeft: 'auto',
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
});

export const progressRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const caption = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
});
