import { style, styleVariants } from '@vanilla-extract/css';
import { MOBILE, vars } from 'styles/vars.css';
import { card } from 'styles/layout.css';

export const heatmap = style([card, {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: vars.space.lg,

  '@media': {
    [MOBILE]: { flexDirection: 'column', alignItems: 'stretch' },
  },
}]);

// 첫 줄은 달 이름, 첫 열은 요일 — 칸 자리는 컴포넌트가 gridRow·gridColumn으로 정한다
export const grid = style({
  display: 'grid',
  gridTemplateRows: 'auto repeat(7, 12px)',
  gap: '3px',
});

export const month = style({
  gridRow: 1,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
});

export const weekday = style({
  gridColumn: 1,
  fontSize: '0.65rem',
  lineHeight: '12px',
  color: vars.color.textMuted,
});

const cell = style({
  width: '12px',
  height: '12px',
  borderRadius: '3px',
});

// 빈 날은 얕은 홈, 학습한 날은 '알아요'와 같은 초록을 목표 대비로 진하게
export const level = styleVariants({
  0: [cell, { boxShadow: vars.shadow.track }],
  1: [cell, { backgroundColor: 'rgba(4, 120, 87, 0.3)' }],
  2: [cell, { backgroundColor: 'rgba(4, 120, 87, 0.6)' }],
  3: [cell, { backgroundColor: vars.color.know }],
});

export const today = style({
  outline: `1.5px solid ${vars.color.textDark}`,
  outlineOffset: '1px',
});

export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: vars.space.xs,

  '@media': {
    [MOBILE]: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: vars.space.md },
  },
});

export const figure = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const value = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.textDark,
});

export const legend = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  marginTop: vars.space.xs,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
});
