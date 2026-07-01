import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 2.7rem)',
  gap: '4px',
  width: '100%',
});

export const cell = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.7rem',
  height: '1.8rem',
  borderRadius: '3px',
  fontSize: '0.65rem',
  fontWeight: 500,
  color: vars.color.textMuted,
  cursor: 'pointer',
  backgroundColor: vars.color.bg,
  boxShadow: '2px 2px 5px rgba(163,177,198,0.6), -2px -2px 5px rgba(255,255,255,0.8)',
  transition: 'box-shadow 0.1s, color 0.1s',
  userSelect: 'none',
});

export const cellHover = style({
  boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.7), inset -2px -2px 4px rgba(255,255,255,0.9)',
  color: vars.color.textDark,
});

export const cellSelected = style({
  boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.9), inset -2px -2px 4px rgba(255,255,255,1)',
  color: vars.color.textDark,
  fontWeight: 700,
});
