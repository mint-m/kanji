import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  width: '100%',
  marginBottom: vars.space.md,
});

// 나가기 — 글자는 제목 왼쪽 끝에 맞춘다
export const exit = style({
  alignSelf: 'flex-start',
  marginLeft: `calc(-1 * ${vars.space.sm})`,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textDecoration: 'none',

  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceHover, color: vars.color.textDark },
  },
});

export const titleRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.space.sm,
});

export const title = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 600,
  lineHeight: 1,
  color: vars.color.textDark,
});

export const subtitle = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textMuted,
});

export const progressRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const caption = style({
  display: 'inline-flex',
  gap: vars.space.sm,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
});

export const remaining = style({
  fontWeight: 400,
});
