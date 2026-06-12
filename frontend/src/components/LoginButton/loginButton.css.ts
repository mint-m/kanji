import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const base = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  width: '240px',
  height: '48px',
  borderRadius: vars.radius.md,
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  transition: 'filter 0.15s',
  selectors: {
    '&:hover': { filter: 'brightness(0.95)' },
    '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
  },
});

export const google = style([base, {
  backgroundColor: '#ffffff',
  color: '#3c4043',
  border: '1px solid #dadce0',
  selectors: {
    '&:hover': { backgroundColor: '#f8f9fa' },
  },
}]);

export const kakao = style([base, {
  backgroundColor: '#FEE500',
  color: '#191919',
}]);

export const errorText = style({
  color: '#f44336',
  marginTop: vars.space.sm,
  fontSize: vars.fontSize.sm,
  textAlign: 'center',
});
