import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const wrapper = style({
  width: '100%',
  maxWidth: '520px',
  padding: `0 ${vars.space.md}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xl,
});

export const heading = style({
  fontSize: vars.fontSize.md,
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const sessionGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.lg,
  width: '100%',

  '@media': {
    'screen and (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const sessionCard = style({
  position: 'relative',
  padding: vars.space.lg,
  borderRadius: vars.radius.xl,
  backgroundColor: vars.color.bg,
  boxShadow: vars.shadow.outer,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  border: 'none',
  transition: 'box-shadow 0.2s',
  textAlign: 'left',

  selectors: {
    '&:hover': {
      boxShadow: '8px 8px 16px rgba(163,177,198,0.7), -8px -8px 16px rgba(255,255,255,0.6)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
});

/* 선택된 세션: 오목(pressed) 효과로 "현재 위치" 표현 */
export const sessionCardActive = style({
  boxShadow: 'inset 4px 4px 10px rgba(163,177,198,0.55), inset -4px -4px 10px rgba(255,255,255,0.85)',

  selectors: {
    '&:hover': {
      boxShadow: 'inset 4px 4px 10px rgba(163,177,198,0.55), inset -4px -4px 10px rgba(255,255,255,0.85)',
    },
  },
});

/* "최근 학습" 표시: 우측 상단 절대 배치 */
export const activeLabel = style({
  position: 'absolute',
  top: vars.space.md,
  right: vars.space.md,
  fontSize: '0.7rem',
  fontWeight: 500,
  color: vars.color.textFaint,
  letterSpacing: '0.04em',
});

export const sessionLabel = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  color: vars.color.textDark,
  letterSpacing: '-0.02em',
});

export const sessionInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minHeight: '44px',
});

export const infoRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
});

export const infoKey = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
});

export const infoValue = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
});

export const infoEmpty = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textFaint,
  fontStyle: 'italic',
});

/* CTA 버튼: 뉴모피즘 raised, 파랑 없음 */
export const ctaBtn = style({
  marginTop: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textDark,
  backgroundColor: vars.color.bg,
  cursor: 'pointer',
  boxShadow: '3px 3px 7px rgba(163,177,198,0.55), -3px -3px 7px rgba(255,255,255,0.9)',
  transition: 'box-shadow 0.15s',
  alignSelf: 'flex-start',

  selectors: {
    '&:hover': {
      boxShadow: '4px 4px 9px rgba(163,177,198,0.65), -4px -4px 9px rgba(255,255,255,1)',
    },
    '&:active': {
      boxShadow: 'inset 2px 2px 5px rgba(163,177,198,0.4), inset -2px -2px 5px rgba(255,255,255,0.7)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
});
