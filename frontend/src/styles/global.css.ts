import { globalStyle, globalKeyframes } from '@vanilla-extract/css';
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

// Utility classes (shared across components)
globalStyle('.card', {
  backgroundColor: vars.color.white,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.outer,
});

globalStyle('.section-title', {
  fontSize: vars.fontSize.lg,
  marginTop: 0,
  marginBottom: vars.space.md,
  color: vars.color.textDark,
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

globalStyle('.progress-text', {
  fontSize: vars.fontSize.sm,
  color: '#495057',
  textAlign: 'right',
  marginTop: vars.space.sm,
  fontWeight: 500,
});

globalStyle('.filter-select', {
  paddingLeft: vars.space.md,
  paddingRight: vars.space.md,
  paddingTop: vars.space.sm,
  paddingBottom: vars.space.sm,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.white,
  cursor: 'pointer',
  fontSize: vars.fontSize.base,
  outline: 'none',
});

globalStyle('.filter-select:focus', {
  borderColor: vars.color.primary,
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

globalKeyframes('slideDown', {
  from: { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
  to:   { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
});

globalKeyframes('shimmer', {
  '0%':   { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});
