import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  width: '100%',
  maxWidth: '560px',
  margin: '0 auto',
  padding: `${vars.space.lg} ${vars.space.md} ${vars.space.xl}`,
});

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  minHeight: 'min(28rem, 58vh)',
  padding: vars.space.xl,
  textAlign: 'center',
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.inner,
});

export const title = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  color: vars.color.textDark,
});

export const desc = style({
  maxWidth: '26rem',
  fontSize: vars.fontSize.base,
  lineHeight: 1.6,
  color: vars.color.textMuted,
});

export const stats = style({
  display: 'flex',
  gap: vars.space.xl,
});

export const stat = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const statValue = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 700,
  color: vars.color.textDark,
  fontVariantNumeric: 'tabular-nums',
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: vars.space.sm,
  marginTop: vars.space.sm,
});

export const notice = style({
  marginBottom: vars.space.md,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  color: vars.color.unknown,
  backgroundColor: vars.color.unknownBg,
});
