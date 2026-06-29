import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const wordRow = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  height: 'fit-content',
  fontFamily: vars.font.jp,
});

export const kanjiChar = style({
  cursor: 'pointer',
});

export const plainChar = style({
  cursor: 'default',
});

export const notFoundChar = style({
  cursor: 'default',
  opacity: 0.4,
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
});
