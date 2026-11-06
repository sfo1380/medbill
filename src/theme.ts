/** Colors, spacing and type from the MVP design canvas. */

export const colors = {
  ground: '#F6F7F9',
  surface: '#FFFFFF',
  ink: '#14202B',
  inkSoft: '#3A4651',
  muted: '#56616D',
  border: '#E2E6EA',
  borderStrong: '#D5DBE0',

  teal: '#0F6E68',
  tealDark: '#0A524D',
  tealTint: '#E6F2F1',
  tealOnDark: '#D3ECE9',

  orange: '#B4530A',
  orangeText: '#8A3F08',
  orangeTint: '#FDF1E6',
  orangeBorder: '#E8C9A9',

  blueText: '#1F4E8C',
  blueTint: '#E8EFF9',

  paper: '#FBFBFA',
  white: '#FFFFFF',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Minimum touch target, per platform accessibility guidance. */
export const TOUCH = 44;

export const type = {
  display: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  tiny: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
};
