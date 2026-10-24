import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

// 상단 바를 뺀 나머지 높이의 가운데
export const centerDiv = style({
  minHeight: `calc(100vh - ${vars.layout.header})`,
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});
