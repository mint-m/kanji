import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const errorBanner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: vars.color.dangerBg,
  border: `1px solid ${vars.color.dangerBorder}`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space.md} 20px`,
  marginBottom: vars.space.md,
});

export const errorIcon = style({
  fontSize: '1.25rem',
});

export const errorText = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});

export const warningBanner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: '#fffbeb',
  border: `1px solid #fcd34d`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space.md} 20px`,
  marginBottom: vars.space.md,
});

export const warningText = style({
  color: '#92400e',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});

export const completedCard = style({
  width: '85vw',
  aspectRatio: '3 / 4',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  boxShadow: vars.shadow.inner,

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
      height: '28rem',
      aspectRatio: 'auto',
    },
  },
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
  color: vars.color.textMuted,
  fontWeight: 500,
});

export const statValueGreen = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.success,
});

export const statValueAmber = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.warning,
});
