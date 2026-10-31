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
  padding: `${vars.space.sm} ${vars.space.md}`,
  boxShadow: vars.shadow.outer,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-in-out, transform 0.3s ease-in-out',
});

// 접힌 카드는 한자 줄만 보인다 — 훈음이 세 개(楽)여도 잘리지 않는 높이
export const cardCollapsed = style({
  maxHeight: '10rem',
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

// 한자 · 훈음 · 등급 · 펼침 표시를 한 줄에 세로 가운데로 맞춘다
export const kanjiRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  margin: `${vars.space.sm} 0`,
});

export const kanjiGlyph = style({
  fontSize: vars.fontSize.kanji,
  lineHeight: 1,
  marginRight: vars.space.sm,
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
  fontSize: vars.fontSize.md,
});

export const pronMean = style({
  color: vars.color.textMuted,
});

export const pronSound = style({
  fontWeight: 600,
  color: vars.color.textDark,
});

// 등급과 음·훈 표시 — 학습 카드의 품사 칩과 같은 얕은 홈 모양
export const chip = style({
  flexShrink: 0,
  padding: '2px 8px',
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  lineHeight: 1.5,
  color: vars.color.textMuted,
  boxShadow: vars.shadow.track,
});

export const chevron = style({
  flexShrink: 0,
  color: vars.color.textFaint,
  transition: 'transform 0.2s',
});

export const chevronUp = style({
  transform: 'rotate(180deg)',
});

// 넓은 화면의 카드는 400px에서 잘리므로 읽기 칸이 따로 스크롤한다 — 훈독이 열 개인 下·生도 스크롤 없이 들어가는 높이
export const readings = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: `${vars.space.xs} 0 ${vars.space.sm}`,
  fontSize: vars.fontSize.md,
  maxHeight: '15rem',
  overflowY: 'auto',

  '@media': {
    'screen and (max-width: 1099px)': { maxHeight: 'none', overflowY: 'visible' },
  },
});

export const readingGroup = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
});

export const readingList = style({
  display: 'flex',
  flexWrap: 'wrap',
  lineHeight: 1.6,
});

// 읽기 하나는 줄을 넘기지 않고, 읽기 사이에 ・를 둔다
export const readingItem = style({
  whiteSpace: 'nowrap',

  selectors: {
    '&:not(:last-child)::after': { content: '"・"', color: vars.color.textFaint },
  },
});
