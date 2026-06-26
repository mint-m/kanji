import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const loginButtons = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  alignItems: 'center',
});

export const errorText = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.sm,
  margin: 0,
});
