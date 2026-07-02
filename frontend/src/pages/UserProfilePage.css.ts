import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const SOFT = vars.shadow.soft;
const PRESSED = vars.shadow.pressed;
const TRACK = vars.shadow.track;

const HOVER = '0 3px 10px rgba(163,177,198,0.45)';

export const page = style({
  maxWidth: '900px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const pageTitle = style({
  fontSize: '1.375rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
  margin: `0 0 ${vars.space.xl}`,
});

export const card = style({
  backgroundColor: vars.color.bg,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  boxShadow: SOFT,
  marginBottom: vars.space.xl,
});

export const sectionTitle = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
  margin: `0 0 ${vars.space.md}`,
});

/* ── 프로필 헤더 ── */
export const profileHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const headerTop = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
});

export const profileInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  flex: '1 1 200px',
  minWidth: 0,
});

export const nameRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const profileName = style({
  margin: 0,
  fontSize: vars.fontSize.md,
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
});

// 이름 옆의 조용한 수정 트리거
export const editBtn = style({
  border: 'none',
  background: 'none',
  padding: `2px ${vars.space.xs}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  whiteSpace: 'nowrap',
  transition: 'color 0.15s',

  selectors: {
    '&:hover': { color: vars.color.textMuted },
  },
});

export const profileMeta = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

/* ── 닉네임 편집 ── */
export const nameEdit = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
});

export const nameInput = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  color: vars.color.textDark,
  padding: `6px ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.bg,
  boxShadow: TRACK,
  outline: 'none',
  width: '160px',
  maxWidth: '100%',
});

export const nameSaveBtn = style({
  border: 'none',
  padding: `6px ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
  backgroundColor: vars.color.bg,
  boxShadow: SOFT,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover:not(:disabled)': { boxShadow: HOVER },
    '&:active:not(:disabled)': { boxShadow: PRESSED },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const nameCancelBtn = style({
  border: 'none',
  background: 'none',
  padding: `6px ${vars.space.xs}`,
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  cursor: 'pointer',

  selectors: {
    '&:hover': { color: vars.color.textMuted },
  },
});

const headerBtn = {
  padding: `10px ${vars.space.lg}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  backgroundColor: vars.color.bg,
  boxShadow: SOFT,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',
  whiteSpace: 'nowrap',
} as const;

// 학습 통계 — 통계 정보와 같은 그룹의 우측 버튼
export const statsBtn = style({
  ...headerBtn,
  color: vars.color.textDark,

  selectors: {
    '&:hover': { boxShadow: HOVER },
    '&:active': { boxShadow: PRESSED },
  },
});

/* ── 통계 그룹: 간단한 통계 + 학습 통계 버튼 ── */
export const statsGroup = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
  paddingTop: vars.space.md,
  boxShadow: `inset 0 1px 0 ${vars.color.borderLight}`,
});

// 간단한 통계 — 값별 짧은 라벨 한 줄
export const miniStats = style({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: `${vars.space.xs} ${vars.space.md}`,
  minWidth: 0,
});

// 라벨 + 값 한 쌍
export const miniStatItem = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: vars.space.xs,
});

// 라벨만 약한 강조
export const miniLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
});

// 값은 강조하지 않음
export const miniValue = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  color: vars.color.textFaint,
});

/* ── 계정 연동 ── */
export const providerList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

// 각 제공자 = 오목한 서브 타일로 명확히 구분
export const providerRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  boxShadow: TRACK,
});

export const providerName = style({
  fontSize: vars.fontSize.base,
  fontWeight: 500,
  color: vars.color.textDark,
});

// 연동됨 / 연동하기 — 동일 크기 pill, 상태는 눌림(완료)/떠오름(액션)으로 구분
const basePill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '76px',
  padding: `6px ${vars.space.md}`,
  borderRadius: vars.radius.pill,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
} as const;

export const linkedBadge = style({
  ...basePill,
  color: vars.color.textFaint,
  backgroundColor: vars.color.bg,
  boxShadow: TRACK,
});

export const linkBtn = style({
  ...basePill,
  color: vars.color.textDark,
  backgroundColor: vars.color.bg,
  border: 'none',
  boxShadow: SOFT,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover:not(:disabled)': { boxShadow: HOVER },
    '&:active:not(:disabled)': { boxShadow: PRESSED },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const fieldError = style({
  margin: `${vars.space.xs} 0 0`,
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
});

export const linkErrorMsg = style({
  marginTop: vars.space.md,
  marginBottom: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.danger,
});

// 로그아웃 — 헤더 우측, 유일한 색 강조(danger)
export const logoutBtn = style({
  ...headerBtn,
  color: vars.color.danger,

  selectors: {
    '&:hover': { boxShadow: HOVER },
    '&:active': { boxShadow: PRESSED },
  },
});
