import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.sm,
  width: '100%',
  marginTop: vars.space.md,
});

globalStyle(`${grid} > *`, {
  width: '100%',
});
