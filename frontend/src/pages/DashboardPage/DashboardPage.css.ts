import { style, keyframes } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

// 정돈된 뉴모피즘 그림자 — styles/vars.css의 공용 토큰 사용
const SOFT = vars.shadow.soft;
const PRESSED = vars.shadow.pressed;
const TRACK = vars.shadow.track;

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

// 정돈된 카드: 배경과 같은 톤 + 얕은 그림자
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

/* ── 학습 세션 ── */
// 세그먼트 토글 트랙: 오목한 홈 안에 선택 세그먼트가 떠오르도록
export const sessionBtns = style({
  display: 'flex',
  gap: vars.space.xs,
  padding: vars.space.xs,
  borderRadius: vars.radius.md,
  boxShadow: TRACK,
  marginBottom: vars.space.lg,
});

export const sessionBtn = style({
  flex: 1,
  padding: `8px 0`,
  border: 'none',
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color 0.15s, box-shadow 0.15s',
  backgroundColor: 'transparent',
  color: vars.color.textMuted,

  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});

// 선택된 세션 — 트랙 위로 떠오른 세그먼트
export const sessionBtnActive = style({
  backgroundColor: vars.color.bg,
  boxShadow: SOFT,
  color: vars.color.textDark,
  fontWeight: 600,
});

// 카드 제목보다 한 단계 낮은 캡션 위계
export const subTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  marginBottom: vars.space.md,
});

export const progressRow = style({
  display: 'flex',
  gap: vars.space.xxl,
  marginBottom: vars.space.lg,
  transition: 'opacity 0.2s ease',
});

// 세션 전환 중 이전 데이터를 은은하게 흐려 새로고침 중임을 표시
export const progressRowLoading = style({
  opacity: 0.4,
});

const shimmer = keyframes({
  '0%': { opacity: 0.5 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.5 },
});

// 값 자리를 지키는 스켈레톤 — 로딩 텍스트 깜빡임 대신 레이아웃 유지
export const skeletonBar = style({
  width: '3rem',
  height: '1.4rem',
  borderRadius: vars.radius.sm,
  boxShadow: TRACK,
  animation: `${shimmer} 1.2s ease-in-out infinite`,
});

export const progressCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const progressCellLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const progressCellValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const noProgress = style({
  padding: `${vars.space.sm} 0`,
  color: vars.color.textFaint,
  fontSize: vars.fontSize.sm,
  fontStyle: 'italic',
  marginBottom: vars.space.lg,
});

export const actionBtns = style({
  display: 'flex',
  gap: vars.space.md,

  '@media': {
    'screen and (max-width: 640px)': {
      flexDirection: 'column',
    },
  },
});

// 액션 버튼 — 깔끔한 플랫, 컬러 없음
export const actionBtn = style({
  flex: 1,
  padding: `10px ${vars.space.lg}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
  backgroundColor: vars.color.bg,
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',
  boxShadow: SOFT,

  selectors: {
    '&:hover': {
      boxShadow: '0 3px 10px rgba(163,177,198,0.45)',
    },
    '&:active': {
      boxShadow: PRESSED,
    },
  },
});

/* ── 통계 카드 ── */
export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

export const statCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.lg} ${vars.space.md}`,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.lg,
  boxShadow: SOFT,
});

export const statValue = style({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  color: vars.color.textFaint,
});

/* ── 레벨별 진행률 ── */
export const levelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const levelRow = style({
  display: 'grid',
  gridTemplateColumns: '40px 1fr 56px',
  alignItems: 'center',
  gap: vars.space.md,
});

export const levelLabel = style({
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  color: vars.color.textDark,
});

export const progressTrack = style({
  height: '8px',
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.round,
  boxShadow: TRACK,
  overflow: 'hidden',
});

// 채움 — 컬러 대신 중성 톤
export const progressFill = style({
  height: '100%',
  backgroundColor: vars.color.textMuted,
  borderRadius: vars.radius.round,
  transition: 'width 0.4s ease',
});

export const progressText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  textAlign: 'right',
});
