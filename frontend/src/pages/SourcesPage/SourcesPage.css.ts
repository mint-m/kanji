import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  color: vars.color.text,
});

globalStyle(`${body} a`, {
  color: vars.color.primary,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingLeft: vars.space.lg,
});

export const acknowledgement = style({
  color: vars.color.textMuted,
});
