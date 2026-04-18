import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const errorText = style({
  color: '#f44336',
  marginTop: vars.space.sm,
  fontSize: vars.fontSize.sm,
  textAlign: 'center',
});
