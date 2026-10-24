import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: `${vars.space.md} ${vars.space.xl}`,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: vars.fontSize.base,
  boxShadow: vars.shadow.outer,
  transition: 'background-color 0.2s, box-shadow 0.2s',

  selectors: {
    '&:hover': {
      backgroundColor: vars.color.surfaceHover,
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
});

export const pressed = style({
  boxShadow: vars.shadow.inner,
});

// 역할별 색 — 주 동작(파랑)과 응답(알아요 초록·몰라요 주황)을 공개 토글과 구분한다
export const variant = styleVariants({
  default: {},
  primary: {
    backgroundColor: vars.color.primary,
    color: vars.color.white,
    fontWeight: 600,
    boxShadow: vars.shadow.soft,
    selectors: { '&:hover': { backgroundColor: vars.color.primaryDark } },
  },
  know: {
    backgroundColor: vars.color.knowBg,
    color: vars.color.know,
    fontWeight: 600,
    selectors: { '&:hover': { backgroundColor: '#a7f3d0' } },
  },
  unknown: {
    backgroundColor: vars.color.unknownBg,
    color: vars.color.unknown,
    fontWeight: 600,
    selectors: { '&:hover': { backgroundColor: '#fde68a' } },
  },
  ghost: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: vars.color.textMuted,
    selectors: { '&:hover': { backgroundColor: vars.color.surfaceHover } },
  },
});
