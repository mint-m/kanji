import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  gap: vars.space.lg,
});

export const message = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});
