import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

// 넓은 화면: 카드 왼쪽에 붙는 칸 / 좁은 화면: 아래에서 올라오는 시트 — 예전처럼 카드를 옆으로 밀어내지 않는다
export const panel = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 60,
  maxHeight: '80vh',
  overflowY: 'auto',
  padding: `${vars.space.sm} ${vars.space.md} ${vars.space.lg}`,
  backgroundColor: vars.color.bg,
  borderTopLeftRadius: vars.radius.xl,
  borderTopRightRadius: vars.radius.xl,
  boxShadow: '0 -6px 24px rgba(163,177,198,0.55)',

  '@media': {
    'screen and (min-width: 1100px)': {
      position: 'absolute',
      left: 'auto',
      bottom: 'auto',
      right: `calc(100% + ${vars.space.lg})`,
      // 카드 윗변보다 조금 위 — 진행 표시 줄과 높이를 맞춘다
      top: '-5vh',
      width: '280px',
      maxHeight: 'none',
      padding: 0,
      backgroundColor: 'transparent',
      borderRadius: 0,
      boxShadow: 'none',
      overflow: 'visible',
    },
  },
});

// 시트 뒤를 덮어 바깥을 누르면 닫힌다. 넓은 화면의 옆 패널에는 없다
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 59,
  backgroundColor: 'rgba(44, 62, 80, 0.25)',

  '@media': {
    'screen and (min-width: 1100px)': { display: 'none' },
  },
});

export const panelHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: `0 0 ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  color: vars.color.textMuted,
});

export const closeBtn = style({
  width: '32px',
  height: '32px',
  border: 'none',
  borderRadius: '50%',
  background: 'none',
  fontSize: vars.fontSize.base,
  color: vars.color.textMuted,
  cursor: 'pointer',

  selectors: {
    '&:hover': { backgroundColor: vars.color.surfaceHover },
  },
});
