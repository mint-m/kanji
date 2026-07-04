import { style } from '@vanilla-extract/css';
import { vars } from 'styles/vars.css';

export const errorBanner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: vars.color.dangerBg,
  border: `1px solid ${vars.color.dangerBorder}`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space.md} 20px`,
  marginBottom: vars.space.md,
});

export const errorIcon = style({
  fontSize: '1.25rem',
});

export const errorText = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});

export const warningBanner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  backgroundColor: '#fffbeb',
  border: `1px solid #fcd34d`,
  borderRadius: vars.radius.lg,
  padding: `${vars.space.md} 20px`,
  marginBottom: vars.space.md,
});

export const warningText = style({
  color: '#92400e',
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
});

export const completedCard = style({
  width: '85vw',
  aspectRatio: '3 / 4',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  backgroundColor: vars.color.bg,
  borderRadius: vars.radius.lg,
  textAlign: 'center',
  boxShadow: vars.shadow.inner,
  overflowY: 'auto',

  '@media': {
    'screen and (min-width: 768px)': {
      width: '35rem',
      height: '28rem',
      aspectRatio: 'auto',
    },
  },
});

export const completedTitle = style({
  marginBottom: vars.space.lg,
  color: vars.color.textDark,
  fontSize: vars.fontSize.lg,
  fontWeight: 600,
});

export const statsRow = style({
  display: 'flex',
  justifyContent: 'center',
  gap: vars.space.xl,
  margin: `${vars.space.lg} 0`,
});

export const statItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
});

// 숫자를 눌러 단어 목록을 펼치는 탭 가능한 통계 항목
export const statItemButton = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: 'none',
  borderRadius: vars.radius.md,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'box-shadow 0.15s ease',
  ':hover': {
    boxShadow: vars.shadow.track,
  },
});

export const statItemActive = style({
  boxShadow: vars.shadow.pressed,
});

export const statLabel = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  fontWeight: 500,
});

export const statHint = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textFaint,
  margin: `0 0 ${vars.space.md}`,
});

export const wordList = style({
  width: '100%',
  maxHeight: '9rem',
  overflowY: 'auto',
  margin: `0 0 ${vars.space.md}`,
  padding: vars.space.sm,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.track,
  textAlign: 'left',
});

export const wordListEmpty = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  textAlign: 'center',
  padding: vars.space.md,
});

export const wordItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.md,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${vars.color.borderLight}`,
    },
  },
});

export const wordItemEntry = style({
  fontWeight: 600,
  color: vars.color.textDark,
  whiteSpace: 'nowrap',
});

export const wordItemMean = style({
  color: vars.color.textMuted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const completeDesc = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textMuted,
  lineHeight: 1.5,
  margin: `0 0 ${vars.space.md}`,
});

export const completeActions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  width: '100%',
  alignItems: 'center',
});

export const statValueGreen = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.success,
});

export const statValueAmber = style({
  fontSize: vars.fontSize.xl,
  fontWeight: 'bold',
  color: vars.color.warning,
});
