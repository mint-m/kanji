import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const summaryBox = style({
  backgroundColor: vars.color.surfaceLight,
  padding: vars.space.lg,
  borderRadius: vars.radius.md,
  marginBottom: vars.space.xl,
  textAlign: 'center',
  boxShadow: vars.shadow.outer,
});

export const summaryTitle = style({
  marginTop: 0,
  fontSize: vars.fontSize.lg,
});

export const summaryItem = style({
  margin: `${vars.space.sm} 0`,
  fontSize: vars.fontSize.md,
});
