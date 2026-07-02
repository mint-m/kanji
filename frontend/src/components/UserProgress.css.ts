import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const SOFT = vars.shadow.soft;
const TRACK = vars.shadow.track;

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
});

// 대시보드와 동일한 톤의 카드
export const card = style({
  backgroundColor: vars.color.bg,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: SOFT,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.md}`,
});

/* ── 진행률 바 ── */
export const progressBarTrack = style({
  height: '8px',
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.round,
  boxShadow: TRACK,
  overflow: 'hidden',
});

// 채움 — 컬러 대신 중성 톤 (대시보드 레벨 바와 통일)
export const progressBarFill = style({
  height: '100%',
  backgroundColor: vars.color.textMuted,
  borderRadius: vars.radius.round,
  transition: 'width 0.4s ease',
});

export const progressMeta = style({
  marginTop: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  textAlign: 'right',
});

/* ── 세션 ── */
export const sessionsGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

// 카드 내부의 오목한 서브 패널
export const sessionCard = style({
  padding: vars.space.lg,
  borderRadius: vars.radius.md,
  boxShadow: TRACK,
});

export const sessionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: vars.space.md,
});

export const sessionLabel = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
});

// 레벨 배지 — 중립 톤 (파랑 제거)
export const levelBadge = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
  padding: `2px ${vars.space.md}`,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.pill,
  boxShadow: SOFT,
});

export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.md,
  marginBottom: vars.space.md,
});

export const statCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const statCellLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const statCellValue = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
});

export const emptyState = style({
  textAlign: 'center',
  padding: vars.space.xl,
  color: vars.color.textFaint,
  fontSize: vars.fontSize.sm,
});
