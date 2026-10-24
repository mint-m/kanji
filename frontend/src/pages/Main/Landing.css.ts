import { style } from '@vanilla-extract/css';
import { vars, MOBILE } from 'styles/vars.css';

export const hero = style({
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  alignItems: 'center',
  gap: vars.space.xxl,
  padding: `${vars.space.xxl} 0`,

  '@media': {
    [MOBILE]: { gridTemplateColumns: '1fr', gap: vars.space.xl, padding: `${vars.space.lg} 0` },
  },
});

export const eyebrow = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  color: vars.color.primary,
  letterSpacing: '0.02em',
});

export const title = style({
  margin: `${vars.space.sm} 0 ${vars.space.md}`,
  fontSize: '2.25rem',
  fontWeight: 800,
  lineHeight: 1.3,
  letterSpacing: '-0.02em',
  color: vars.color.textDark,

  '@media': {
    [MOBILE]: { fontSize: '1.75rem' },
  },
});

export const lead = style({
  fontSize: vars.fontSize.md,
  lineHeight: 1.7,
  color: vars.color.textMuted,
});

export const buttons = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.sm,
  marginTop: vars.space.xl,

  '@media': {
    [MOBILE]: { alignItems: 'stretch' },
  },
});

// 실제 학습 카드처럼 보이는 예시
export const demo = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.xxl} ${vars.space.lg}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.inner,
});

export const demoReading = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textMuted,
});

export const demoWord = style({
  fontSize: '4.5rem',
  fontFamily: vars.font.jp,
  lineHeight: 1.1,
  color: vars.color.textStrong,
});

export const demoMean = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textDark,
});

export const demoAnswers = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.sm,
  width: '100%',
  marginTop: vars.space.lg,
});

export const demoAnswer = style({
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  textAlign: 'center',
  fontWeight: 700,
});

export const features = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.lg,

  '@media': {
    [MOBILE]: { gridTemplateColumns: '1fr' },
  },
});

export const feature = style({
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.soft,
});

export const featureTitle = style({
  marginBottom: vars.space.sm,
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.textDark,
});

export const featureText = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  color: vars.color.textMuted,
});

export const error = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.sm,
});
