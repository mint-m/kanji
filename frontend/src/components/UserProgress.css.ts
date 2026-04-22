import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const container = style({
  width: '100%',
});

export const pageTitle = style({
  marginTop: 0,
  textAlign: 'center',
  color: vars.color.textDark,
  marginBottom: vars.space.lg,
});

export const overallSection = style({
  marginBottom: vars.space.xl,
  padding: vars.space.lg,
  backgroundColor: vars.color.surfaceGray,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.borderMid}`,
});

export const sectionHeading = style({
  fontSize: vars.fontSize.md,
  fontWeight: 600,
  color: vars.color.textDark,
  marginBottom: vars.space.md,
  marginTop: 0,
});

export const progressBarTrack = style({
  height: '12px',
  backgroundColor: vars.color.borderLight,
  borderRadius: vars.radius.md,
  overflow: 'hidden',
  marginTop: vars.space.md,
});

export const progressBarFill = style({
  height: '100%',
  backgroundColor: vars.color.primary,
  borderRadius: vars.radius.md,
  transition: 'width 0.3s ease-in-out',
});

export const sessionsGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  marginTop: vars.space.lg,
});

export const sessionCard = style({
  padding: vars.space.lg,
  backgroundColor: vars.color.white,
  border: `1px solid ${vars.color.borderMid}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.inner,
});

export const sessionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: vars.space.md,
});

export const sessionLabel = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
});

export const levelBadge = style({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: vars.color.primary,
  padding: `4px ${vars.space.sm}`,
  backgroundColor: vars.color.primaryBg,
  borderRadius: vars.radius.sm,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.md,
  marginBottom: vars.space.md,
});

export const statCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const statCellLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const statCellValue = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textStrong,
});

export const emptyState = style({
  textAlign: 'center',
  padding: vars.space.xl,
  color: vars.color.textLight,
  fontStyle: 'italic',
});
