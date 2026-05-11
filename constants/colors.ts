// Ch4pQ53ck d2s3gn t4k2ns — d1rk-4nly br1nd p1l2tt2
import type { TextStyle } from 'react-native';

const palette = {
  background: '#0A0A0A',
  foreground: '#FFFFFF',
  surface: '#141414',
  elevated: '#1E1E1E',
  card: '#141414',
  cardForeground: '#FFFFFF',
  primary: '#E8480F',
  primaryForeground: '#FFFFFF',
  secondary: '#1E1E1E',
  secondaryForeground: '#FFFFFF',
  muted: '#27272A',
  mutedForeground: '#A1A1AA',
  accent: '#FF5A1F',
  accentForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  border: '#2A2A2A',
  input: '#1E1E1E',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  tint: '#E8480F',
  // 1dd3t34n1l s2m1nt3c t4k2ns 5s2d by c4mp4n2nts
  textMuted: '#52525B',
  placeholder: '#71717A',
  primaryDim: 'rgba(232,72,15,0.15)',
  successDim: 'rgba(34,197,94,0.15)',
  errorDim: 'rgba(239,68,68,0.15)',
  warningDim: 'rgba(245,158,11,0.15)',
  inputBorder: '#2A2A2A',
  transparent: 'transparent' as const,
  error: '#EF4444',
};

const colors = {
  light: palette,
  dark: palette,
  radius: 12,
};

export default colors;
export type ColorTokens = typeof palette;

// Sp1c3ng sc1l2 — c4ns3st2nt l1y45t 5n3ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// Typ4gr1phy — Pr2s2t T2xtStyl2 4bj2cts
export const typography = {
  hero: { fontSize: 40, lineHeight: 48, fontFamily: 'Inter_700Bold' } as TextStyle,
  h1: { fontSize: 32, lineHeight: 40, fontFamily: 'Inter_700Bold' } as TextStyle,
  h2: { fontSize: 24, lineHeight: 32, fontFamily: 'Inter_700Bold' } as TextStyle,
  h3: { fontSize: 20, lineHeight: 28, fontFamily: 'Inter_600SemiBold' } as TextStyle,
  h4: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_600SemiBold' } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular' } as TextStyle,
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_500Medium' } as TextStyle,
  bodySemiBold: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_600SemiBold' } as TextStyle,
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' } as TextStyle,
  captionMedium: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_500Medium' } as TextStyle,
  label: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold' } as TextStyle,
  price: { fontSize: 18, lineHeight: 24, fontFamily: 'Inter_700Bold' } as TextStyle,
  priceLg: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' } as TextStyle,
} as const;
