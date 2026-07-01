import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '800px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const profileHeader = style({
  display: 'flex',
  alignItems: 'center',
  marginBottom: vars.space.xl,
});

export const avatar = style({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  marginRight: vars.space.lg,
  flexShrink: 0,
});

export const profileInfo = style({});

export const profileName = style({
  margin: 0,
  marginBottom: vars.space.sm,
  fontSize: vars.fontSize.xl,
});

export const profileMeta = style({
  margin: 0,
  marginTop: vars.space.xs,
  color: vars.color.textLight,
});

export const providerList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const providerRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${vars.space.sm} 0`,
  borderBottom: `1px solid ${vars.color.borderLight}`,

  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const providerName = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,
});

export const linkedBadge = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.success,
  backgroundColor: '#ecfdf5',
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.pill,
  fontWeight: 500,
});

export const linkBtn = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.primary,
  backgroundColor: vars.color.primaryLight,
  border: `1px solid ${vars.color.primary}`,
  borderRadius: vars.radius.md,
  padding: `4px ${vars.space.sm}`,
  cursor: 'pointer',
  transition: 'all 0.15s',

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: vars.color.primary,
      color: vars.color.white,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

export const linkErrorMsg = style({
  marginTop: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
});
