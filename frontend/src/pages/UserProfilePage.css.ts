import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '800px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const profileHeader = style({
  display: 'flex',
  alignItems: 'center',
  marginBottom: vars.space.xl,
});

export const avatar = style({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  marginRight: vars.space.lg,
  flexShrink: 0,
});

export const profileInfo = style({});

export const profileName = style({
  margin: 0,
  marginBottom: vars.space.sm,
  fontSize: '1.8rem',
});

export const profileMeta = style({
  margin: 0,
  marginTop: vars.space.xs,
  color: vars.color.textLight,
});

export const sessionBtns = style({
  display: 'flex',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const sessionBtn = style({
  flex: 1,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  border: `2px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.base,
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: vars.color.white,
  color: vars.color.textLight,

  selectors: {
    '&:hover:not(:disabled)': {
      borderColor: vars.color.primary,
      backgroundColor: vars.color.primaryLight,
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
});

export const sessionBtnActive = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  fontWeight: 'bold',
});

export const progressRow = style({
  display: 'flex',
  gap: vars.space.xxl,
  marginBottom: vars.space.lg,
});

export const progressCell = style({
  display: 'flex',
  flexDirection: 'column',
});

export const progressCellLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  marginBottom: vars.space.xs,
});

export const progressCellValue = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 'bold',
  color: vars.color.textDark,
});

export const noProgress = style({
  padding: vars.space.md,
  color: vars.color.textFaint,
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

export const accountSection = style({
  textAlign: 'center',
});
