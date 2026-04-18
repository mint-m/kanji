import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const header = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
});

export const subtitle = style({
  fontSize: vars.fontSize.lg,
});
