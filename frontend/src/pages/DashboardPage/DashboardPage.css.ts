import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '900px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const pageTitle = style({
  fontSize: '1.375rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  margin: `0 0 ${vars.space.xl}`,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: vars.space.md,
  marginBottom: '44px',
});

export const statCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `14px ${vars.space.lg}`,
});

export const statValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const streakValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  color: vars.color.textFaint,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.md}`,
});

export const levelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const levelRow = style({
  display: 'grid',
  gridTemplateColumns: '40px 1fr 56px',
  alignItems: 'center',
  gap: vars.space.md,
});

export const levelLabel = style({
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
});

export const progressTrack = style({
  height: '8px',
  backgroundColor: vars.color.borderMid,
  borderRadius: vars.radius.round,
  overflow: 'hidden',
});

export const progressFill = style({
  height: '100%',
  backgroundColor: vars.color.primary,
  borderRadius: vars.radius.round,
  transition: 'width 0.4s ease',
});

export const progressText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  textAlign: 'right',
});

export const sessionBtns = style({
  display: 'flex',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const sessionBtn = style({
  flex: 1,
  padding: `8px ${vars.space.lg}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, color 0.15s',
  backgroundColor: vars.color.bg,
  color: vars.color.textMuted,
  boxShadow: '4px 4px 8px rgba(163,177,198,0.55), -4px -4px 8px rgba(255,255,255,0.9)',

  selectors: {
    '&:hover:not(:disabled)': {
      boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,1)',
      color: vars.color.primary,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const sessionBtnActive = style({
  boxShadow: 'inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)',
  color: vars.color.primary,
  fontWeight: 600,
});

export const subTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textFaint,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: vars.space.sm,
});

export const progressRow = style({
  display: 'flex',
  gap: vars.space.xxl,
  marginBottom: vars.space.lg,
});

export const progressCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const progressCellLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const progressCellValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const noProgress = style({
  padding: `${vars.space.sm} 0`,
  color: vars.color.textFaint,
  fontSize: vars.fontSize.sm,
  fontStyle: 'italic',
  marginBottom: vars.space.lg,
});

export const actionBtns = style({
  display: 'flex',
  gap: vars.space.md,

  '@media': {
    'screen and (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
});

export const actionBtn = style({
  flex: 1,
  padding: `8px ${vars.space.lg}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.primary,
  backgroundColor: vars.color.bg,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, color 0.15s',
  boxShadow: '4px 4px 8px rgba(163,177,198,0.55), -4px -4px 8px rgba(255,255,255,0.9)',

  selectors: {
    '&:hover': {
      boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,1)',
      color: vars.color.primaryDark,
    },
    '&:active': {
      boxShadow: 'inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)',
    },
  },
});
