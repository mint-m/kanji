import { style } from '@vanilla-extract/css';
import { MOBILE, vars } from 'styles/vars.css';

export const wrapper = style({
  position: 'relative',
  width: '100%',
});

export const card = style({
  position: 'relative',
  width: '100%',
  minHeight: 'min(28rem, 58vh)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.md,
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  textAlign: 'center',
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.inner,
  cursor: 'pointer',
});

export const tools = style({
  position: 'absolute',
  top: vars.space.sm,
  right: vars.space.sm,
  display: 'flex',
  gap: vars.space.xs,
});

export const toolBtn = style({
  width: '40px',
  height: '40px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '50%',
  background: 'none',
  fontSize: '1.4rem',
  lineHeight: 1,
  color: vars.color.textFaint,
  cursor: 'pointer',
  transition: 'color 0.2s, transform 0.2s',

  selectors: {
    '&:hover': { color: vars.color.textDark, transform: 'scale(1.08)' },
    '&[aria-pressed="true"]': { color: vars.color.warning },
  },
});

export const reading = style({
  minHeight: '2.2rem',
  fontSize: vars.fontSize.xl,
  color: vars.color.textMuted,
});

// 표제어 칸 높이를 고정해 글자 수가 달라도 자리가 같다
export const headword = style({
  height: '7rem',
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// 뜻 칸도 높이를 고정한다 — 길면 칸 안에서 스크롤하고, 가려진 동안에도 카드 모양이 단어마다 같다
export const meaning = style({
  width: '100%',
  height: '8rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const parts = style({
  display: 'flex',
  gap: vars.space.xs,
});

export const part = style({
  padding: '2px 8px',
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textMuted,
  boxShadow: vars.shadow.track,
});

export const means = style({
  listStyle: 'none',
  fontSize: vars.fontSize.lg,
  color: vars.color.textDark,
  lineHeight: 1.4,
});

// 자리는 지키고 보이지만 않게 — 공개할 때 카드가 출렁이지 않는다
export const concealed = style({
  visibility: 'hidden',
});

export const tapHint = style({
  position: 'absolute',
  bottom: vars.space.md,
  left: 0,
  right: 0,
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,
});

export const controls = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  marginTop: vars.space.md,
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.sm,
});

export const revealBtn = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.fontSize.sm,
});

// 응답 버튼도 다른 버튼과 같은 뉴모피즘 바탕 — 색은 글자와 화살표에만 써서 시선이 카드에 머문다
export const answerBtn = style({
  padding: `${vars.space.md} ${vars.space.md}`,
  fontSize: vars.fontSize.base,
  fontWeight: 600,
});

export const know = style({ color: vars.color.know });

export const unknown = style({ color: vars.color.unknown });

export const key = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.7rem',
  height: '1.7rem',
  borderRadius: '50%',
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  boxShadow: vars.shadow.pressed,

  // 키보드가 없는 기기에서는 숨긴다
  '@media': {
    '(hover: none)': { display: 'none' },
    [MOBILE]: { display: 'none' },
  },
});

export const shortcutHint = style({
  margin: `${vars.space.xs} 0 0`,
  textAlign: 'center',
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,

  // 키보드가 없는 터치 기기·모바일 폭에서는 숨긴다
  '@media': {
    '(hover: none)': { display: 'none' },
    [MOBILE]: { display: 'none' },
  },
});
