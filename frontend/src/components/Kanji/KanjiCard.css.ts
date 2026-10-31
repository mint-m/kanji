import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const card = style({
  position: 'relative',
  marginTop: vars.space.sm,
  marginBottom: vars.space.sm,
  width: '100%',
  backgroundColor: vars.color.bg,
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space.sm,
  boxShadow: vars.shadow.outer,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-in-out, transform 0.3s ease-in-out',

});

export const cardCollapsed = style({
  maxHeight: 'calc(7rem + 2vw)',
});

export const cardExpanded = style({
  maxHeight: '400px',

  // 좁은 화면의 시트는 음독·훈독을 자르지 않고 한 번에 다 보인다 — 시트 자체가 스크롤한다
  '@media': {
    'screen and (max-width: 1099px)': { maxHeight: 'none' },
  },
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

// 한자와 훈음 목록을 세로 가운데로 맞춘다
export const kanjiRow = style({
  display: 'flex',
  alignItems: 'center',
  margin: '8px 0 12px',
});

export const kanjiGlyph = style({
  fontSize: vars.fontSize.kanji,
  lineHeight: 1,
  marginRight: vars.space.md,
});

export const missing = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
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

  '@media': {
    'screen and (max-width: 1099px)': { maxHeight: 'none', overflowY: 'visible' },
  },

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

// 음·훈 표시 — 학습 카드의 품사 칩과 같은 얕은 홈 모양 (예전의 검은 테두리 상자는 뉴모피즘 결에서 튀었다)
export const readingTag = style({
  flexShrink: 0,
  padding: '2px 8px',
  marginTop: '2px',
  marginRight: vars.space.sm,
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  lineHeight: 1.5,
  color: vars.color.textMuted,
  boxShadow: vars.shadow.track,
  height: 'fit-content',
});

export const readingList = style({
  display: 'flex',
  flexDirection: 'column',
});

export const readingItem = style({
  lineHeight: '1.5rem',
});
