import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '800px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const backBtn = style({
  flexShrink: 0,
  fontSize: vars.fontSize.sm,
});

export const pageTitle = style({
  margin: 0,
  fontSize: vars.fontSize.xl,
  color: vars.color.textDark,
});
