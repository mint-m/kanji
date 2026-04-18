import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const errorBanner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: '#fee2e2',
  border: '1px solid #fca5a5',
  borderRadius: vars.radius.xl,
  padding: `${vars.space.md} 20px`,
  marginBottom: vars.space.md,
});

export const errorIcon = style({
  fontSize: '1.25rem',
});

export const errorText = style({
  color: '#991b1b',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});

export const completedCard = style({
  marginTop: vars.space.xl,
  padding: vars.space.xl,
  background: 'linear-gradient(135deg, #f0f7ff, #e6f2ff)',
  borderRadius: '1rem',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
});

export const completedTitle = style({
  marginBottom: vars.space.lg,
  color: vars.color.textDark,
  fontSize: vars.fontSize.lg,
  fontWeight: 600,
});

export const statsRow = style({
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.xl,
  margin: `${vars.space.lg} 0`,
});

export const statItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  color: '#64748b',
  fontWeight: 500,
});

export const statValueGreen = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: '#10b981',
});

export const statValueAmber = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: '#f59e0b',
});

export const restartButton = style({
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: vars.color.white,
  border: 'none',
  borderRadius: vars.radius.xl,
  padding: `14px ${vars.space.xl}`,
  marginTop: vars.space.lg,
  cursor: 'pointer',
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  transition: 'all 0.2s',

  selectors: {
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
});
