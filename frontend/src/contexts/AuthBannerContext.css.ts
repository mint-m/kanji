import { style, keyframes } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const slideDown = keyframes({
  from: { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
  to:   { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
});

export const banner = style({
  position: 'fixed',
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: 'rgba(118, 180, 255, 0.20)',
  borderRadius: vars.radius.lg,
  padding: `${vars.space.md} ${vars.space.lg}`,
  backdropFilter: 'blur(4px)',
  boxShadow: vars.shadow.card,
  animation: `${slideDown} 0.3s ease-out`,
});

export const bannerText = style({
  color: vars.color.textStrong,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});
