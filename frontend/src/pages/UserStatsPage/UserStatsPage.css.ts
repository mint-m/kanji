import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

const SOFT = vars.shadow.soft;
const PRESSED = vars.shadow.pressed;

export const page = style({
  maxWidth: '900px',
  margin: `${vars.space.xl} auto`,
  padding: `0 ${vars.space.md}`,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  marginBottom: vars.space.xl,
});

// 중립 톤의 떠오른 back 버튼
export const backBtn = style({
  flexShrink: 0,
  padding: `8px ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
  backgroundColor: vars.color.bg,
  cursor: 'pointer',
  boxShadow: SOFT,
  transition: 'box-shadow 0.15s',

  selectors: {
    '&:hover': { boxShadow: '0 3px 10px rgba(163,177,198,0.45)' },
    '&:active': { boxShadow: PRESSED },
  },
});

export const pageTitle = style({
  margin: 0,
  fontSize: '1.375rem',
  fontWeight: 600,
  color: vars.color.textDark,
  letterSpacing: '-0.01em',
});
