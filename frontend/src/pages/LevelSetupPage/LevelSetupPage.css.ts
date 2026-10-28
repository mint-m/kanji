import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

/* ── 공통 ── */

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  padding: vars.space.xxl,
  gap: vars.space.xl,
  boxSizing: 'border-box',
});

export const title = style({
  fontSize: vars.fontSize.xl,
  color: vars.color.textDark,
  fontWeight: 'bold',
  margin: 0,
});

export const subtitle = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textMuted,
  margin: 0,
});

/* ── 경고창 ── */

export const warningBox = style({
  width: '100%',
  backgroundColor: vars.color.dangerBg,
  border: `1px solid ${vars.color.dangerBorder}`,
  borderRadius: vars.radius.md,
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const warningTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 'bold',
  color: vars.color.danger,
  margin: 0,
});

export const warningDetail = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
  margin: 0,
});

export const confirmLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
});

/* ── PC 레이아웃 ── */

export const pcLayout = style({
  display: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xl,
  width: '36rem',

  '@media': {
    'screen and (min-width: 768px)': {
      display: 'flex',
    },
  },
});

export const descBox = style({
  width: '100%',
  height: '5rem',
  backgroundColor: vars.color.primaryBg,
  borderRadius: vars.radius.md,
  padding: `${vars.space.md} ${vars.space.lg}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  boxSizing: 'border-box',
});

export const descLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 'bold',
  color: vars.color.primary,
});

export const descText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
  lineHeight: '1.5',
});

export const descPlaceholder = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const pcLevelRow = style({
  display: 'flex',
  gap: vars.space.md,
  width: '100%',
  justifyContent: 'center',
});

export const pcLevelButton = style({
  flex: 1,
  backgroundColor: vars.color.bg,
  color: vars.color.textDark,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: `${vars.space.md} 0`,
  cursor: 'pointer',
  fontSize: vars.fontSize.md,
  fontWeight: 'bold',
  boxShadow: vars.shadow.outer,
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover': {
      boxShadow: vars.shadow.hover,
    },
  },
});

export const pcLevelButtonSelected = style({
  boxShadow: vars.shadow.inner,
  color: vars.color.primary,
});

/* ── 모바일 레이아웃 ── */

export const mobileLayout = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.md,
  width: '100%',
  maxWidth: '320px',

  '@media': {
    'screen and (min-width: 768px)': {
      display: 'none',
    },
  },
});

export const mobileLevelButton = style({
  width: '100%',
  backgroundColor: vars.color.bg,
  color: vars.color.textDark,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: `${vars.space.md} ${vars.space.xl}`,
  cursor: 'pointer',
  fontSize: vars.fontSize.md,
  fontWeight: 'bold',
  boxShadow: vars.shadow.outer,
  transition: 'box-shadow 0.15s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
  textAlign: 'left',

  selectors: {
    '&:hover': {
      boxShadow: vars.shadow.hover,
    },
  },
});

export const mobileLevelButtonSelected = style({
  boxShadow: vars.shadow.inner,
  color: vars.color.primary,
});

export const levelName = style({
  fontSize: vars.fontSize.md,
  fontWeight: 'bold',
});

export const levelLabel = style({
  fontSize: vars.fontSize.sm,
  color: 'inherit',
  opacity: 0.75,
  fontWeight: 'normal',
});

export const mobileDesc = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textLight,
  fontWeight: 'normal',
  lineHeight: '1.4',
  marginTop: vars.space.xs,
});

/* ── 공통 하단 ── */

export const changeWarning = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
  margin: 0,
});

export const errorText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
  margin: 0,
});

export const doneBox = style({
  width: '100%',
  backgroundColor: vars.color.primaryBg,
  borderRadius: vars.radius.md,
  padding: vars.space.md,
  margin: `0 0 ${vars.space.md}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
  textAlign: 'center',
});
