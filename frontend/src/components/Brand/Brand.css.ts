import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

// 네비(우상단)의 대칭점 — 좌상단 워드마크, 강조 최소화
export const brand = style({
  position: 'absolute',
  top: vars.space.md,
  left: vars.space.lg,
  zIndex: 50,
  display: 'inline-flex',
  alignItems: 'center',
  height: '38px',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '1.1rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: vars.color.textMuted,
  transition: 'color 0.15s',

  selectors: {
    '&:hover': { color: vars.color.textDark },
  },

  // 모바일/태블릿: 좌측 여백이 없어 페이지 제목과 겹치므로 로고 숨김
  '@media': {
    'screen and (max-width: 1024px)': { display: 'none' },
  },
});

// 하단 밑줄 디자인 요소 — currentColor라 hover 시 텍스트와 함께 진해짐
export const word = style({
  display: 'inline-block',
  lineHeight: 1,
  paddingBottom: '3px',
  borderBottom: '2px solid currentColor',
});
