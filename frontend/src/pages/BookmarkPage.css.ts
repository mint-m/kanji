import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '900px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const pageTitle = style({
  fontSize: '1.375rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  margin: 0,
  marginBottom: vars.space.xl,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const statCard = style({
  textAlign: 'center',
  padding: `${vars.space.lg} ${vars.space.md}`,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textMuted,
  letterSpacing: '0.03em',
  marginBottom: vars.space.sm,
});

export const statValue = style({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: vars.color.textDark,
  letterSpacing: '-0.03em',
});

export const filtersBar = style({
  display: 'flex',
  gap: vars.space.lg,
  alignItems: 'center',
  marginBottom: vars.space.lg,
  padding: `${vars.space.md} ${vars.space.lg}`,

  '@media': {
    'screen and (max-width: 640px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: vars.space.md,
    },
  },
});

export const filterGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const filterLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textMuted,
  whiteSpace: 'nowrap',
});

export const bookmarkList = style({
  display: 'grid',
  gap: vars.space.md,
});

export const bookmarkCard = style({
  transition: 'transform 0.15s, box-shadow 0.15s',

  selectors: {
    '&:hover': {
      transform: 'translateY(-1px)',
    },
  },
});

export const bookmarkHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: vars.space.md,
});

export const wordMain = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
});

export const wordPron = style({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
});

export const wordEntry = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textFaint,
  fontWeight: 400,
});

export const levelBadge = style({
  padding: '3px 10px',
  borderRadius: vars.radius.sm,
  fontSize: '0.7rem',
  fontWeight: 700,
  color: vars.color.white,
  letterSpacing: '0.04em',
  flexShrink: 0,
});

export const meanings = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2px',
  marginBottom: vars.space.sm,
});

export const meaningItem = style({
  fontSize: vars.fontSize.base,
  color: '#3a3a3a',

  selectors: {
    '&:not(:last-child)::after': {
      content: '"  ·  "',
      color: vars.color.textFaint,
    },
  },
});

export const partsRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.xs,
  marginBottom: vars.space.sm,
});

export const partTag = style({
  padding: '2px 8px',
  backgroundColor: vars.color.surfaceGray,
  color: vars.color.textMuted,
  borderRadius: vars.radius.sm,
  fontSize: '0.75rem',
  fontWeight: 400,
});

export const notesBox = style({
  marginTop: vars.space.sm,
});

export const notesTextarea = style({
  width: '100%',
  minHeight: '72px',
  padding: vars.space.sm,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,
  backgroundColor: vars.color.surfaceGray,
  resize: 'vertical',
  outline: 'none',
  fontFamily: 'inherit',

  selectors: {
    '&:focus': {
      borderColor: vars.color.primary,
      backgroundColor: vars.color.white,
    },
  },
});

export const notesActions = style({
  display: 'flex',
  gap: vars.space.sm,
  marginTop: vars.space.sm,
});

export const saveBtn = style({
  padding: `6px ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,

  selectors: {
    '&:hover': { backgroundColor: vars.color.primaryDark },
  },
});

export const cancelBtn = style({
  padding: `6px ${vars.space.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  backgroundColor: 'transparent',
  color: vars.color.textMuted,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,

  selectors: {
    '&:hover': { borderColor: vars.color.textMuted },
  },
});

export const notesDisplay = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  cursor: 'pointer',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  borderLeft: `3px solid ${vars.color.borderLight}`,

  selectors: {
    '&:hover': {
      borderLeftColor: vars.color.primary,
      backgroundColor: vars.color.surfaceGray,
    },
  },
});

export const addNotesBtn = style({
  background: 'none',
  border: 'none',
  color: vars.color.textFaint,
  padding: `${vars.space.xs} 0`,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,
  textAlign: 'left',

  selectors: {
    '&:hover': { color: vars.color.primary },
  },
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: vars.space.md,
  paddingTop: vars.space.sm,
  borderTop: `1px solid ${vars.color.borderLight}`,
});

export const dateText = style({
  fontSize: '0.75rem',
  color: vars.color.textFaint,
});

export const deleteBtn = style({
  padding: `4px ${vars.space.sm}`,
  backgroundColor: 'transparent',
  color: vars.color.textFaint,
  border: `1px solid ${vars.color.borderLight}`,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  fontSize: '0.75rem',
  transition: 'all 0.15s',

  selectors: {
    '&:hover': {
      color: vars.color.danger,
      borderColor: vars.color.danger,
    },
  },
});

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: vars.space.xl,
  marginTop: vars.space.xl,
});

export const paginationInfo = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textMuted,
});

export const paginationSub = style({
  marginLeft: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const emptyCard = style({
  textAlign: 'center',
  padding: '64px 32px',
});

export const emptyTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textMuted,
  marginBottom: vars.space.sm,
});

export const emptyDesc = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});
