import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

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

export const meaning = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  minHeight: '4rem',
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

export const answerBtn = style({
  padding: `${vars.space.md} ${vars.space.md}`,
  fontSize: vars.fontSize.md,
});

export const key = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  opacity: 0.7,

  '@media': {
    '(hover: none)': { display: 'none' },
  },
});

export const shortcutHint = style({
  margin: `${vars.space.xs} 0 0`,
  textAlign: 'center',
  fontSize: vars.fontSize.xs,
  color: vars.color.textMuted,

  // 키보드가 없는 터치 기기에서는 숨긴다
  '@media': {
    '(hover: none)': { display: 'none' },
  },
});
