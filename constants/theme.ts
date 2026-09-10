export const palette = {
  cream: '#FFFDF7',
  latte: '#F5E6CA',
  espresso: '#4B3832',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.latte,
  accent: palette.espresso,
  text: palette.espresso,
  textMuted: 'rgba(75, 56, 50, 0.62)',
  border: 'rgba(75, 56, 50, 0.16)',
  onAccent: palette.cream,
  glass: 'rgba(255, 253, 247, 0.42)',
  overlay: 'rgba(75, 56, 50, 0.38)',
  success: palette.espresso,
  danger: palette.espresso,
  warning: palette.espresso,
  tableAvailable: '#2E7D32',
  tableOccupied: '#C62828',
  tableReset: '#C9A227',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const touchTarget = 48;
