import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const title = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textDark,
  margin: 0,
});

export const message = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  margin: `${vars.space.sm} 0 ${vars.space.lg}`,
});
