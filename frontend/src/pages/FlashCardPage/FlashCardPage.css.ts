import { style, keyframes } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const shimmer = keyframes({
  '0%':   { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});

const shimmerBg = `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`;

export const page = style({
  display: 'grid',
  height: '100vh',
  gridTemplateColumns: '1fr auto 1fr',
  gridTemplateRows: '1fr 1fr',
  placeItems: 'center',
});

export const flashCardArea = style({
  gridRow: 'span 2',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: 'fit-content',
});

export const skeletonCard = style({
  width: '85vw',
  aspectRatio: '3 / 4',
  background: shimmerBg,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: vars.radius.md,

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
      height: '28rem',
      aspectRatio: 'auto',
    },
  },
});

export const skeletonBtn = style({
  width: '200px',
  height: '40px',
  background: shimmerBg,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: vars.radius.pill,
  margin: '0 auto',
});

export const skeletonWrapper = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const slowHint = style({
  width: '100%',
  margin: `${vars.space.md} 0 0`,
  textAlign: 'center',
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});
