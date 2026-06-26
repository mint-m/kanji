import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '1000px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const pageTitle = style({
  fontSize: vars.fontSize.xl,
  color: vars.color.textDark,
  margin: 0,
  marginBottom: vars.space.xl,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const statCard = style({
  textAlign: 'center',
  padding: vars.space.lg,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  marginBottom: vars.space.sm,
});

export const statValue = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.primary,
});

export const filtersBar = style({
  display: 'flex',
  gap: vars.space.lg,
  marginBottom: vars.space.lg,

  '@media': {
    'screen and (max-width: 640px)': {
      flexDirection: 'column',
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
  fontWeight: 500,
  color: vars.color.textDark,
  whiteSpace: 'nowrap',
});

export const bookmarkList = style({
  display: 'grid',
  gap: vars.space.md,
});

export const bookmarkCard = style({
  transition: 'transform 0.2s',

  selectors: {
    '&:hover': {
      transform: 'translateY(-2px)',
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
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const wordPron = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.textDark,
});

export const wordEntry = style({
  fontSize: vars.fontSize.md,
  color: vars.color.textMuted,
});

export const levelBadge = style({
  padding: `4px ${vars.space.sm}`,
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.sm,
  fontWeight: 'bold',
  color: vars.color.white,
});

export const meanings = style({
  marginBottom: vars.space.md,
});

export const meaningItem = style({
  padding: `${vars.space.xs} 0`,
  color: vars.color.textDark,

  selectors: {
    '&::before': {
      content: '"• "',
      color: vars.color.primary,
    },
  },
});

export const partsRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  marginBottom: vars.space.md,
});

export const partTag = style({
  padding: '2px 8px',
  backgroundColor: vars.color.borderLight,
  color: vars.color.textDark,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.sm,
});

export const notesBox = style({
  margin: `${vars.space.md} 0`,
  padding: vars.space.sm,
  backgroundColor: vars.color.surfaceGray,
  borderRadius: vars.radius.md,
  minHeight: '60px',
});

export const notesTextarea = style({
  width: '100%',
  minHeight: '80px',
  padding: vars.space.sm,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.base,
  resize: 'vertical',
  outline: 'none',

  selectors: {
    '&:focus': {
      borderColor: vars.color.primary,
    },
  },
});

export const notesActions = style({
  display: 'flex',
  gap: vars.space.sm,
  marginTop: vars.space.sm,
});

export const saveBtn = style({
  padding: '6px 12px',
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.primary,
  color: vars.color.white,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,

  selectors: {
    '&:hover': { opacity: 0.9 },
  },
});

export const cancelBtn = style({
  padding: '6px 12px',
  border: 'none',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.textFaint,
  color: vars.color.white,
  cursor: 'pointer',
  fontSize: vars.fontSize.sm,

  selectors: {
    '&:hover': { opacity: 0.9 },
  },
});

export const notesDisplay = style({
  color: vars.color.textDark,
  cursor: 'pointer',
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,

  selectors: {
    '&:hover': { backgroundColor: vars.color.borderMid },
  },
});

export const addNotesBtn = style({
  width: '100%',
  background: 'none',
  border: `1px dashed ${vars.color.textFaint}`,
  color: vars.color.textMuted,
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  transition: 'all 0.2s',

  selectors: {
    '&:hover': {
      borderColor: vars.color.primary,
      color: vars.color.primary,
    },
  },
});

export const cardFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: vars.space.md,
  paddingTop: vars.space.md,
  borderTop: `1px solid ${vars.color.borderLight}`,
});

export const dateText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const deleteBtn = style({
  padding: '6px 12px',
  backgroundColor: 'transparent',
  color: vars.color.danger,
  border: `1px solid ${vars.color.danger}`,
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
  transition: 'all 0.2s',

  selectors: {
    '&:hover': {
      backgroundColor: vars.color.danger,
      color: vars.color.white,
    },
  },
});

export const pagination = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: vars.space.xl,
  marginTop: vars.space.xl,
  paddingTop: vars.space.lg,
});

export const paginationInfo = style({
  fontSize: vars.fontSize.base,
  fontWeight: 500,
  color: vars.color.textDark,
});

export const paginationSub = style({
  marginLeft: vars.space.md,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const emptyCard = style({
  textAlign: 'center',
  padding: '64px 32px',
});

export const emptyTitle = style({
  color: vars.color.textMuted,
  marginBottom: vars.space.sm,
});

export const emptyDesc = style({
  color: vars.color.textFaint,
});
