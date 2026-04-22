import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const card = style({
  position: 'relative',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: vars.space.sm,
  marginBottom: vars.space.sm,
  width: '90%',
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space.sm,
  boxShadow: vars.shadow.outer,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-in-out, transform 0.3s ease-in-out',

  selectors: {
    '&:focus-visible': {
      outline: `2px solid #4527a0`,
      outlineOffset: '2px',
    },
  },
});

export const cardCollapsed = style({
  maxHeight: 'calc(7rem + 2vw)',
});

export const cardExpanded = style({
  maxHeight: '400px',
});

export const cardClickable = style({
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',

  selectors: {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: vars.shadow.hover,
    },
  },
});

export const levelBadge = style({
  position: 'absolute',
  top: '8px',
  right: '8px',
  fontSize: vars.fontSize.base,
  fontWeight: 500,
  padding: '4px 8px',
  zIndex: 10,
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textDecorationColor: 'rgba(71, 85, 105, 0.35)',
});

export const indicator = style({
  position: 'absolute',
  bottom: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '48px',
  height: '4px',
  borderRadius: '9999px',
});

export const cardBody = style({
  display: 'flex',
  flexDirection: 'column',
});

export const kanjiRow = style({
  display: 'flex',
  margin: '8px 0 12px',
});

export const kanjiGlyph = style({
  fontSize: vars.fontSize.kanji,
  marginRight: vars.space.md,
});

export const pronWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: vars.space.xs,
});

export const pronEntry = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
});

export const pronMean = style({
  fontSize: vars.fontSize.base,
  fontWeight: 300,
  color: vars.color.textMuted,
});

export const pronSound = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
});

export const readingsPanel = style({
  width: '100%',
  marginTop: vars.space.sm,
});

export const readingsScroll = style({
  padding: vars.space.sm,
  fontSize: vars.fontSize.md,
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.md,
  maxHeight: '130px',
  overflowY: 'auto',

  selectors: {
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1', borderRadius: '9999px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: '9999px' },
    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' },
  },
});

export const readingGroup = style({
  display: 'flex',
  alignItems: 'flex-start',
  flex: 1,
  minWidth: '120px',
});

export const readingTag = style({
  border: `1px solid #333`,
  padding: '2px 6px',
  fontSize: vars.fontSize.sm,
  marginRight: vars.space.sm,
  height: 'fit-content',
  borderRadius: vars.radius.sm,
});

export const readingList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const readingItem = style({
  lineHeight: '1.5rem',
});
