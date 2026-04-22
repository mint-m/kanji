import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const button = style({
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: `${vars.space.md} ${vars.space.xl}`,
  cursor: 'pointer',
  fontSize: vars.fontSize.base,
  boxShadow: vars.shadow.outer,
  transition: 'background-color 0.2s, box-shadow 0.2s',

  selectors: {
    '&:hover': {
      backgroundColor: vars.color.surfaceHover,
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
});

export const pressed = style({
  boxShadow: vars.shadow.inner,
});
