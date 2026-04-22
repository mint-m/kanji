import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const container = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: vars.space.xl,
  width: '40rem',
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.inner,
  gap: vars.space.md,
});
