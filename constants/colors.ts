
import { TextStyle } from 'react-native';

const brandPalette = {
  background: '#0A0A0A',
  foreground: '#FFFFFF',
  surface: '#141414',
  elevated: '#1E1E1E',
  primary: '#E8480F',
  primaryDim: 'rgba(232, 72, 15, 0.1)',
  secondary: '#1E1E1E',
  muted: '#27272A',
  mutedForeground: '#A1A1AA',
  accent: '#FF5A1F',
  destructive: '#EF4444',
  border: '#2A2A2A',
  input: '#1E1E1E',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.1)',
  warning: '#F59E0B',
  warningDim: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorDim: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  textMuted: '#52525B',
  placeholder: '#71717A',
  inputBorder: '#2A2A2A',
  transparent: 'transparent',
  tint: '#E8480F',
};


export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hg: 48,
};

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
};


export default {
  light: brandPalette,
  dark: brandPalette,  
  radius: radius,
};