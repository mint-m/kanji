import { style } from '@vanilla-extract/css';

export const container = style({
  width: 'min(40rem, 90vw)',
});

export const gridWrapper = style({
  '@media': {
    'not all and (hover: hover) and (pointer: fine)': {
      display: 'none',
    },
  },
});

export const sliderWrapper = style({
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      display: 'none',
    },
  },
});
