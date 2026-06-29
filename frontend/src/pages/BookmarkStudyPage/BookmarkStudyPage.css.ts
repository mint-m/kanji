import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: vars.space.lg,
});

export const flashCardArea = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.lg,
  width: 'fit-content',
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '85vw',
  marginBottom: vars.space.xs,

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
    },
  },
});

export const backLink = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  padding: 0,

  selectors: {
    '&:hover': { color: vars.color.primary },
  },
});

export const progress = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  fontWeight: 500,
});

export const resultCard = style({
  width: '85vw',
  aspectRatio: '3 / 4',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  boxShadow: vars.shadow.inner,

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
      height: '28rem',
      aspectRatio: 'auto',
    },
  },
});

export const resultTitle = style({
  marginBottom: vars.space.lg,
  color: vars.color.textDark,
  fontSize: vars.fontSize.lg,
  fontWeight: 600,
});

export const statsRow = style({
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.xl,
  margin: `${vars.space.lg} 0`,
});

export const statItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  fontWeight: 500,
});

export const statValueGreen = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.success,
});

export const statValueAmber = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.warning,
});

export const bookmarkWarningBanner = style({
  background: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: vars.radius.lg,
  padding: `10px ${vars.space.md}`,
  marginBottom: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: '#92400e',
  fontWeight: 500,
  width: '85vw',

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
    },
  },
});

export const centerContent = style({
  textAlign: 'center',
});

export const backBtn = style({
  marginTop: vars.space.lg,
  padding: `10px ${vars.space.xl}`,
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  boxShadow: '4px 4px 8px rgba(163,177,198,0.55), -4px -4px 8px rgba(255,255,255,0.9)',
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.primary,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover': {
      boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,1)',
    },
    '&:active': {
      boxShadow: 'inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)',
    },
  },
});
