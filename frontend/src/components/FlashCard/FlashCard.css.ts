import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const card = style({
  width: '85vw',
  aspectRatio: '3 / 4',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.inner,

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
      height: '28rem',
      aspectRatio: 'auto',
    },
  },
});

export const hiraganaRow = style({
  height: '35%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  fontSize: vars.fontSize.xl,
  color: vars.color.textMuted,
});

export const visible = style({ visibility: 'visible' });
export const invisible = style({ visibility: 'hidden' });

export const meanItem = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textMuted,
});
