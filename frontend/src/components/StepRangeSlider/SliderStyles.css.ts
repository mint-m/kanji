import { globalStyle } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

globalStyle('.slider-container', {
  padding: vars.space.xl,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.bg,
  boxShadow: vars.shadow.sliderInner,
});

globalStyle('.slider-container .rc-slider', {
  height: '2rem !important' as any,
});

globalStyle('.slider-container .rc-slider-rail', {
  height: '1rem',
  borderRadius: '0.5rem',
  background: vars.color.bg,
  boxShadow: vars.shadow.sliderInner,
});

globalStyle('.slider-container .rc-slider-track', {
  height: '1rem',
  background: vars.color.bg,
  boxShadow: vars.shadow.sliderOuter,
});

globalStyle('.slider-container .rc-slider-step', {
  height: '1rem',
});

globalStyle('.slider-container .rc-slider-handle', {
  width: '1.5rem',
  height: '1.5rem',
  border: 'none',
  opacity: 1,
  background: vars.color.bg,
  boxShadow: vars.shadow.sliderOuter,
});

globalStyle('.slider-container .rc-slider-handle:focus', {
  boxShadow: vars.shadow.sliderOuter,
});

globalStyle('.slider-container .rc-slider-handle-dragging', {
  border: 'none !important' as any,
  boxShadow: '4px 4px 10px #bebebe, -4px -4px 10px #ffffff !important' as any,
});

globalStyle('.slider-container .rc-slider-tooltip-inner', {
  minHeight: 'auto',
});

globalStyle('.slider-container .rc-slider-tooltip-placement-top::before', {
  borderTopColor: '#4527a0',
});
