import '@/global.css';

import { Platform, TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  light: {
    // — existing tokens (unchanged) —
    text: '#FFFFFF',
    background: '#2B2D31',
    backgroundElement: '#383A3F',
    backgroundSelected: '#4A4D52',
    textSecondary: '#B0B4BA',
    accent: '#FF9500',
    // — semantic additions —
    surface: '#383A3F',
    surfaceElevated: '#44474D',
    border: '#3F4147',
    borderSubtle: 'rgba(255,255,255,0.06)',
    textTertiary: '#6B7280',
    accentSubtle: 'rgba(255,149,0,0.12)',
    overlay: 'rgba(0,0,0,0.5)',
    success: '#34C759',
    error: '#FF3B30',
  },
  dark: {
    // — existing tokens (unchanged) —
    text: '#FFFFFF',
    background: '#2B2D31',
    backgroundElement: '#383A3F',
    backgroundSelected: '#4A4D52',
    textSecondary: '#B0B4BA',
    accent: '#FF9500',
    // — semantic additions —
    surface: '#383A3F',
    surfaceElevated: '#44474D',
    border: '#3F4147',
    borderSubtle: 'rgba(255,255,255,0.06)',
    textTertiary: '#6B7280',
    accentSubtle: 'rgba(255,149,0,0.12)',
    overlay: 'rgba(0,0,0,0.5)',
    success: '#34C759',
    error: '#FF3B30',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const Shadows: { sm: ShadowStyle; md: ShadowStyle; lg: ShadowStyle } = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight'>;

export const Typography: Record<string, TypographyStyle> = {
  largeTitle:  { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  title1:      { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title2:      { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  title3:      { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  headline:    { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body:        { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  callout:     { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  subhead:     { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  footnote:    { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption:     { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  label:       { fontSize: 11, fontWeight: '600', lineHeight: 13 },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
