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

// 역할별 색 — 주 동작은 파랑. 응답 색(알아요·몰라요)은 학습 카드가 글자에만 쓴다
export const variant = styleVariants({
  default: {},
  primary: {
    backgroundColor: vars.color.primary,
    color: vars.color.white,
    fontWeight: 600,
    boxShadow: vars.shadow.soft,
    selectors: { '&:hover': { backgroundColor: vars.color.primaryDark } },
  },
  ghost: {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: vars.color.textMuted,
    selectors: { '&:hover': { backgroundColor: vars.color.surfaceHover } },
  },
});
