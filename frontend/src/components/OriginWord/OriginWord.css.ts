import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const wordRow = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  lineHeight: 1.15,
  fontFamily: vars.font.jp,
  color: vars.color.textStrong,
});

// 한자는 눌러서 풀이를 볼 수 있는 버튼 — 글자 모양은 그대로 두고 밑줄 점선으로만 알린다
export const kanjiChar = style({
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textDecorationThickness: '2px',
  textDecorationColor: 'rgba(95,107,108,0.35)',
  textUnderlineOffset: '0.12em',

  selectors: {
    '&:hover': { textDecorationColor: vars.color.primary },
    '&:disabled': { cursor: 'progress' },
  },
});

export const notFoundChar = style({
  cursor: 'default',
  textDecoration: 'none',
});
