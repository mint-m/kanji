import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from './vars.css';

// 목록·기록형 페이지의 공통 틀 — 페이지마다 같은 값을 다시 쓰지 않는다
export const page = style({
  width: '100%',
  maxWidth: vars.layout.content,
  margin: '0 auto',
  padding: `${vars.space.xl} ${vars.space.lg} ${vars.space.xxl}`,

  '@media': {
    [MOBILE]: { padding: `${vars.space.lg} ${vars.space.md} ${vars.space.xl}` },
  },
});

export const pageTitle = style({
  fontSize: '1.375rem',
  fontWeight: 700,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  margin: `0 0 ${vars.space.lg}`,
});

export const card = style({
  backgroundColor: vars.color.bg,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.soft,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 700,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.md}`,
});

export const muted = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.6,
});

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});
