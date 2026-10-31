import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from 'styles/vars.css';

export const banner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.base,
  lineHeight: 1.6,
  color: vars.color.know,
  backgroundColor: vars.color.knowBg,
});

export const optionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.md,

  '@media': {
    [MOBILE]: { gridTemplateColumns: '1fr' },
  },
});

export const levelGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,

  '@media': {
    [MOBILE]: { gridTemplateColumns: 'repeat(2, 1fr)' },
  },
});

// 고르는 카드 — 선택하면 눌린 그림자 + 파란 테두리
export const option = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
  padding: vars.space.md,
  border: '2px solid transparent',
  borderRadius: vars.radius.lg,
  fontFamily: 'inherit',
  textAlign: 'left',
  color: vars.color.textDark,
  backgroundColor: vars.color.bg,
  boxShadow: vars.shadow.soft,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, border-color 0.15s',

  selectors: {
    '&:hover': { boxShadow: '0 3px 10px rgba(163,177,198,0.55)' },
    '&[aria-checked="true"]': { borderColor: vars.color.primary, boxShadow: vars.shadow.pressed },
  },
});

export const optionTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
});

export const optionDesc = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.5,
  color: vars.color.textMuted,
});

export const rangeGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
  gap: vars.space.sm,
});

export const rangeOption = style([option, {
  alignItems: 'center',
  padding: `${vars.space.sm} ${vars.space.xs}`,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
}]);

export const rangeWords = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  color: vars.color.textMuted,
});

export const summary = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: `${vars.space.xs} ${vars.space.md}`,
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,
});

export const summaryStrong = style({
  fontWeight: 700,
});

export const warning = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  marginTop: vars.space.md,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
  color: vars.color.unknown,
  backgroundColor: vars.color.unknownBg,
});

export const confirm = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  color: vars.color.textDark,
  cursor: 'pointer',
});

export const startRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: vars.space.md,
  marginTop: vars.space.lg,

  '@media': {
    [MOBILE]: { flexDirection: 'column', alignItems: 'stretch' },
  },
});

export const error = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
});
