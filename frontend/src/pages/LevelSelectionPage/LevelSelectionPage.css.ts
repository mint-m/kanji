import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const page = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xl} ${vars.space.md}`,
  boxSizing: 'border-box',
  overflowY: 'auto',
});

export const pageScrollable = style({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: `${vars.space.xl} ${vars.space.md}`,
  boxSizing: 'border-box',
  overflowY: 'auto',
});

export const inner = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xl,
  width: '100%',
  maxWidth: '36rem',
});

/* ── 스텝 인디케이터 ── */

export const stepper = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
});

export const stepDot = style({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: vars.color.borderMid,
  transition: 'background-color 0.2s',
});

export const stepDotActive = style({
  backgroundColor: vars.color.primary,
  width: 24,
  borderRadius: vars.radius.sm,
});

/* ── 섹션 제목 ── */

export const sectionTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  color: vars.color.textDark,
  margin: 0,
  textAlign: 'center',
});

/* ── 레벨 그리드 ── */

export const levelGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
  width: '100%',
});

export const levelBtn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: 'none',
  backgroundColor: vars.color.bg,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',
  boxShadow: vars.shadow.outer,

  selectors: {
    '&:hover': {
      boxShadow: vars.shadow.inner,
    },
  },
});

export const levelBtnActive = style({
  boxShadow: vars.shadow.inner,
});

export const levelName = style({
  fontSize: vars.fontSize.md,
  fontWeight: 700,
  color: vars.color.textDark,
});

export const levelLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

/* ── 스텝 영역 ── */

export const stepArea = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.lg,
});

export const stepSelectedInfo = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: 'center',
});

/* ── 요약 카드 ── */

export const summaryCard = style({
  width: '100%',
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.lg,
  padding: vars.space.lg,
  boxShadow: vars.shadow.inner,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const summaryRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: vars.fontSize.base,
  color: vars.color.textDark,
});

export const summaryLabel = style({
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
});

export const summaryValue = style({
  fontWeight: 600,
});

/* ── 경고 박스 ── */

export const notRecommendedBox = style({
  width: '100%',
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: vars.space.md,
  boxShadow: vars.shadow.inner,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const notRecommendedTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 'bold',
  color: vars.color.textDark,
  margin: 0,
});

export const notRecommendedDesc = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  margin: 0,
  lineHeight: 1.6,
});

export const warningBox = style({
  width: '100%',
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: vars.space.md,
  boxShadow: vars.shadow.inner,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const warningTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 'bold',
  color: vars.color.danger,
  margin: 0,
});

export const warningDetail = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
  margin: 0,
  lineHeight: 1.5,
});

export const subSessionBtn = style({
  alignSelf: 'flex-start',
  padding: `${vars.space.xs} ${vars.space.md}`,
  fontSize: vars.fontSize.sm,
  backgroundColor: vars.color.bg,
  color: vars.color.textDark,
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  fontWeight: 600,
  boxShadow: vars.shadow.outer,
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover': { boxShadow: vars.shadow.inner },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

/* ── 하단 버튼 영역 ── */

export const navRow = style({
  display: 'flex',
  gap: vars.space.md,
  width: '100%',
  justifyContent: 'space-between',
});

export const noWordsBox = style({
  width: '100%',
  backgroundColor: vars.color.bg,
  border: 'none',
  borderRadius: vars.radius.md,
  padding: vars.space.lg,
  boxShadow: vars.shadow.inner,
  textAlign: 'center',
  color: vars.color.textMuted,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
});
