import { globalStyle } from '@vanilla-extract/css';
import { vars } from './vars.css';

globalStyle('*', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.base,
});

// 키보드로 이동할 때만 보이는 포커스 표시 — 컴포넌트에서 outline을 지우지 않는다
globalStyle(':focus-visible', {
  outline: `2px solid ${vars.color.focus}`,
  outlineOffset: '2px',
});

// Utility classes (shared across components)
globalStyle('.card', {
  backgroundColor: vars.color.white,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.outer,
});

globalStyle('.error-box', {
  color: vars.color.danger,
  backgroundColor: vars.color.dangerBg,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  borderLeft: `4px solid ${vars.color.dangerBorder}`,
});

globalStyle('.loading-text', {
  fontSize: vars.fontSize.md,
  color: '#666',
  textAlign: 'center',
  padding: vars.space.xl,
});

globalStyle('.page-btn', {
  paddingLeft: vars.space.lg,
  paddingRight: vars.space.lg,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.base,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: vars.color.primary,
  color: vars.color.white,
});

globalStyle('.page-btn:hover:not(:disabled)', {
  backgroundColor: vars.color.primaryDark,
});

globalStyle('.page-btn:disabled', {
  backgroundColor: vars.color.borderLight,
  color: vars.color.textFaint,
  cursor: 'not-allowed',
});
