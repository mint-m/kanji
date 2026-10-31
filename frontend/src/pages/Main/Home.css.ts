import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from 'styles/vars.css';
import { card } from 'styles/layout.css';

export const greeting = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
});

export const hello = style({
  fontSize: '1.375rem',
  fontWeight: 700,
  color: vars.color.textDark,
});

export const chips = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
  boxShadow: vars.shadow.soft,
});

export const chipBar = style({
  width: '64px',
});

// 오늘의 복습 — 할 일이 있으면 가장 먼저 눈에 띄게
export const reviewCard = style([card, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,

  '@media': {
    [MOBILE]: { flexDirection: 'column', alignItems: 'stretch' },
  },
}]);

export const reviewCardDue = style({
  border: `2px solid ${vars.color.primary}`,
});

export const cardHead = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const cardTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.textDark,
});

export const cardText = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
  color: vars.color.textMuted,
});

export const strong = style({
  color: vars.color.primary,
  fontWeight: 700,
});

export const sessions = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.lg,

  '@media': {
    [MOBILE]: { gridTemplateColumns: '1fr' },
  },
});

export const sessionCard = style([card, {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
}]);

export const recent = style({
  position: 'absolute',
  top: vars.space.md,
  right: vars.space.md,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.primary,
});

export const position = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,
});

export const level = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
});

export const progressRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textMuted,
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  marginTop: 'auto',
});

export const smallButton = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.fontSize.sm,
});
