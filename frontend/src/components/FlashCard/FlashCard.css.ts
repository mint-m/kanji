import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const card = style({
  position: 'relative',
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

export const bookmarkBtn = style({
  position: 'absolute',
  top: vars.space.md,
  right: vars.space.md,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.6rem',
  lineHeight: 1,
  padding: vars.space.xs,
  color: vars.color.textFaint,
  filter: 'drop-shadow(1px 1px 2px rgba(163,177,198,0.6)) drop-shadow(-1px -1px 1px rgba(255,255,255,0.9))',
  transition: 'color 0.2s, filter 0.2s, transform 0.2s',

  selectors: {
    '&:hover': {
      color: vars.color.warning,
      transform: 'scale(1.08)',
      filter: 'drop-shadow(2px 2px 3px rgba(163,177,198,0.7)) drop-shadow(-1px -1px 2px rgba(255,255,255,1))',
    },
    '&:active': {
      transform: 'scale(0.96)',
      filter: 'drop-shadow(0px 0px 1px rgba(163,177,198,0.3))',
    },
  },
});

export const bookmarkBtnActive = style({
  color: vars.color.warning,
  filter: 'drop-shadow(1px 1px 2px rgba(163,177,198,0.5)) drop-shadow(-1px -1px 1px rgba(255,255,255,0.8))',
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
