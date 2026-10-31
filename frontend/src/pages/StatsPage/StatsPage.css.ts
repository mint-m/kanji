import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';
import { card } from 'styles/layout.css';

export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: vars.space.md,
});

export const tile = style([card, {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
}]);

export const tileLabel = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  color: vars.color.textMuted,
});

export const tileValue = style({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: vars.color.textDark,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
});

export const tileUnit = style({
  fontSize: vars.fontSize.base,
  fontWeight: 600,
  marginLeft: '2px',
});

export const tileSub = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const levelList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
});

export const levelRow = style({
  display: 'grid',
  gridTemplateColumns: '48px 1fr auto',
  alignItems: 'center',
  gap: vars.space.md,
});

export const levelName = style({
  fontWeight: 700,
  color: vars.color.textDark,
});

export const levelCount = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  fontVariantNumeric: 'tabular-nums',
  minWidth: '88px',
  textAlign: 'right',
});

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.md,
  marginTop: vars.space.md,
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
});

export const swatch = style({
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '2px',
  marginRight: vars.space.xs,
  verticalAlign: 'middle',
});
