import { style, keyframes } from '@vanilla-extract/css';

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
  gap: '12px',
  backgroundColor: 'rgba(118, 180, 255, 0.20)',
  borderRadius: '12px',
  padding: '16px 20px',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 4px 12px rgba(118, 180, 255, 0.25)',
  animation: `${slideDown} 0.3s ease-out`,
});

export const bannerText = style({
  color: '#1E2A44',
  fontSize: '0.9rem',
  fontWeight: 500,
});
