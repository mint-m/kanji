import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  width: '100%',
  maxWidth: '560px',
  margin: '0 auto',
  padding: `${vars.space.md} ${vars.space.md} ${vars.space.xl}`,
});

export const backLink = style({
  marginBottom: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
});

export const resultCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  minHeight: 'min(28rem, 58vh)',
  padding: vars.space.xl,
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  color: vars.color.textMuted,
  boxShadow: vars.shadow.inner,
});

export const resultTitle = style({
  color: vars.color.textDark,
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
});

export const statsRow = style({
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.xl,
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
  color: vars.color.know,
});

export const statValueAmber = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.unknown,
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: vars.space.sm,
});

export const bookmarkWarningBanner = style({
  marginBottom: vars.space.sm,
  padding: `10px ${vars.space.md}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.unknown,
  backgroundColor: vars.color.unknownBg,
});
