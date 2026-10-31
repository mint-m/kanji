import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const track = style({
  position: 'relative',
  width: '100%',
  height: '8px',
  borderRadius: vars.radius.pill,
  boxShadow: vars.shadow.track,
  overflow: 'hidden',
});

const bar = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  borderRadius: vars.radius.pill,
  transition: 'width 0.3s ease',
});

export const fill = style([bar, { backgroundColor: '#93b4f5' }]);

// 겹쳐 그리는 진한 막대 (예: 익힌 단어 중 장기 기억)
export const secondary = style([bar, { backgroundColor: vars.color.primary }]);
