import { style, keyframes } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const shimmer = keyframes({
  '0%':   { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
});

const shimmerBg = `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`;

// 카드 한 장에 집중하는 가운데 열 — 한자 풀이는 넓은 화면에서 이 열의 왼쪽에, 좁은 화면에서는 아래 시트로 뜬다
export const page = style({
  width: '100%',
  maxWidth: '560px',
  margin: '0 auto',
  padding: `${vars.space.lg} ${vars.space.md} ${vars.space.xl}`,
});

export const skeletonCard = style({
  width: '100%',
  height: 'min(28rem, 58vh)',
  background: shimmerBg,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: vars.radius.md,
});

export const skeletonBtn = style({
  width: '100%',
  height: '96px',
  background: shimmerBg,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: vars.radius.md,
});

export const skeletonWrapper = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const slowHint = style({
  width: '100%',
  margin: `${vars.space.md} 0 0`,
  textAlign: 'center',
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});
