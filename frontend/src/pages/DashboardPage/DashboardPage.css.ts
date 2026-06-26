import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '800px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const pageTitle = style({
  fontSize: vars.fontSize.xl,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.xl}`,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const statCard = style({
  textAlign: 'center',
  padding: vars.space.lg,
});

export const statValue = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.primary,
  marginBottom: vars.space.xs,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const streakValue = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.warning,
  marginBottom: vars.space.xs,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.md,
  fontWeight: 600,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.md}`,
});

export const levelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const levelRow = style({
  display: 'grid',
  gridTemplateColumns: '40px 1fr 56px',
  alignItems: 'center',
  gap: vars.space.md,
});

export const levelLabel = style({
  fontWeight: 'bold',
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
});

export const progressTrack = style({
  height: '10px',
  backgroundColor: vars.color.borderMid,
  borderRadius: vars.radius.round,
  overflow: 'hidden',
});

export const progressFill = style({
  height: '100%',
  backgroundColor: vars.color.primary,
  borderRadius: vars.radius.round,
  transition: 'width 0.4s ease',
});

export const progressText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: 'right',
});
