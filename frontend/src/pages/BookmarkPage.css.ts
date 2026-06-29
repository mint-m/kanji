import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  maxWidth: '900px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBottom: vars.space.xl,
});

export const totalCount = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textFaint,
  backgroundColor: vars.color.surfaceGray,
  borderRadius: vars.radius.pill,
  padding: '2px 10px',
});

export const pageTitle = style({
  fontSize: '1.375rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  margin: 0,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: vars.space.md,
  marginBottom: '44px',
});

export const statCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `14px ${vars.space.lg}`,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  color: vars.color.textFaint,
});

export const statValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const filtersBar = style({
  display: 'flex',
  gap: vars.space.lg,
  alignItems: 'center',
  marginBottom: '10px',
  padding: `10px ${vars.space.lg}`,
  backgroundColor: 'transparent',
  borderRadius: 0,
  boxShadow: 'none',

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
  fontSize: '0.75rem',
  fontWeight: 500,
  color: vars.color.textFaint,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

export const filterSelect = style({
  appearance: 'none',
  paddingTop: '7px',
  paddingBottom: '7px',
  paddingLeft: vars.space.md,
  paddingRight: '32px',
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  boxShadow: '4px 4px 8px rgba(163,177,198,0.55), -4px -4px 8px rgba(255,255,255,0.9)',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.textDark,
  cursor: 'pointer',
  outline: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2395a5a6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover': {
      boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,1)',
    },
    '&:focus': {
      boxShadow: `inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)`,
    },
  },
});

export const studyBtn = style({
  marginLeft: 'auto',
  padding: `8px ${vars.space.lg}`,
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  boxShadow: '4px 4px 8px rgba(163,177,198,0.55), -4px -4px 8px rgba(255,255,255,0.9)',
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.primary,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, color 0.15s',

  selectors: {
    '&:hover:not(:disabled)': {
      boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,1)',
      color: vars.color.primaryDark,
    },
    '&:active:not(:disabled)': {
      boxShadow: 'inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)',
    },
    '&:disabled': {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
});

export const bookmarkList = style({
  display: 'grid',
  gap: vars.space.md,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
  alignItems: 'center',
  marginBottom: vars.space.md,
});

export const levelBadge = style({
  padding: '3px 10px',
  borderRadius: vars.radius.sm,
  fontSize: '0.65rem',
  fontWeight: 700,
  color: vars.color.white,
  letterSpacing: '0.04em',
});

export const deleteBtn = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.1rem',
  lineHeight: 1,
  color: vars.color.textFaint,
  padding: '2px 4px',
  transition: 'color 0.15s',

  selectors: {
    '&:hover': { color: vars.color.danger },
  },
});

export const wordArea = style({
  textAlign: 'center',
  padding: `${vars.space.sm} 0 ${vars.space.md}`,
});

export const wordKanji = style({
  display: 'block',
  fontSize: '2rem',
  fontWeight: 700,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  lineHeight: 1.8,
});

export const wordReading = style({
  fontSize: '0.8rem',
  fontWeight: 400,
  color: vars.color.textFaint,
  letterSpacing: 'normal',
});

export const metaArea = style({
  marginBottom: vars.space.md,
});

export const meanings = style({
  fontSize: vars.fontSize.base,
  fontWeight: 500,
  color: vars.color.textMuted,
  margin: 0,
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
  marginTop: vars.space.md,
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
