import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: `calc(100vh - ${vars.layout.header})`,
  padding: vars.space.md,
  gap: vars.space.lg,
});

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  width: 'min(320px, 100%)',
  padding: `${vars.space.xl} ${vars.space.lg}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.inner,
});

export const reading = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});

export const word = style({
  fontSize: '3.5rem',
  fontFamily: vars.font.jp,
  color: vars.color.textStrong,
});

export const mean = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});

export const message = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});
