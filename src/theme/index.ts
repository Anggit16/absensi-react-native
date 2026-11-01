import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Design tokens AbsensiPro.
 * Palet mengikuti PRD: navy (#0F172A), hijau (#10B981), amber (#F59E0B),
 * merah (#EF4444), dan latar terang (#F8FAFC).
 */
export const colors = {
  primary: '#0F172A',
  primarySoft: '#1E293B',
  primaryMuted: '#334155',
  accent: '#10B981',
  accentDark: '#047857',
  accentSoft: '#D1FAE5',
  accentSubtle: '#ECFDF5',
  warning: '#F59E0B',
  warningDark: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerDark: '#B91C1C',
  dangerSoft: '#FEE2E2',
  info: '#3B82F6',
  infoDark: '#1D4ED8',
  infoSoft: '#DBEAFE',
  violet: '#8B5CF6',
  violetSoft: '#EDE9FE',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#CBD5E1',

  overlay: 'rgba(15, 23, 42, 0.55)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  giant: 40,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10,
  caption: 11,
  small: 12,
  body: 14,
  bodyLg: 15,
  subtitle: 16,
  title: 18,
  titleLg: 20,
  heading: 24,
  display: 30,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const shadows = {
  none: {} as ViewStyle,
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }),
  floating: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 720,
  tabBarHeight: 62,
  inputHeight: 50,
  buttonHeight: 50,
  headerHeight: 56,
} as const;

export const textStyles: Record<string, TextStyle> = {
  display: { fontSize: fontSize.display, lineHeight: 36, fontWeight: '700', color: colors.text },
  heading: { fontSize: fontSize.heading, lineHeight: 30, fontWeight: '700', color: colors.text },
  titleLg: { fontSize: fontSize.titleLg, lineHeight: 26, fontWeight: '700', color: colors.text },
  title: { fontSize: fontSize.title, lineHeight: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.subtitle, lineHeight: 22, fontWeight: '600', color: colors.text },
  body: { fontSize: fontSize.body, lineHeight: 21, fontWeight: '400', color: colors.text },
  bodyMedium: { fontSize: fontSize.body, lineHeight: 21, fontWeight: '500', color: colors.text },
  bodyStrong: { fontSize: fontSize.body, lineHeight: 21, fontWeight: '600', color: colors.text },
  small: { fontSize: fontSize.small, lineHeight: 18, fontWeight: '400', color: colors.textSecondary },
  smallStrong: { fontSize: fontSize.small, lineHeight: 18, fontWeight: '600', color: colors.textSecondary },
  caption: { fontSize: fontSize.caption, lineHeight: 15, fontWeight: '500', color: colors.textMuted },
  label: {
    fontSize: fontSize.small,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  number: {
    fontSize: fontSize.titleLg,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  numberLg: {
    fontSize: fontSize.heading,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
};

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadows,
  layout,
  textStyles,
} as const;

export type Theme = typeof theme;
export type ColorName = keyof typeof colors;
