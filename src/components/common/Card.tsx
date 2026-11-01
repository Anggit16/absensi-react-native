import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'default' | 'dark' | 'accent' | 'warning' | 'danger' | 'muted';
}

const TONES: Record<NonNullable<CardProps['tone']>, { backgroundColor: string; borderColor: string }> = {
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  dark: { backgroundColor: colors.primary, borderColor: colors.primary },
  accent: { backgroundColor: colors.accentSubtle, borderColor: colors.accentSoft },
  warning: { backgroundColor: colors.warningSoft, borderColor: '#FDE68A' },
  danger: { backgroundColor: colors.dangerSoft, borderColor: '#FECACA' },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
};

export function Card({ children, style, padded = true, onPress, accessibilityLabel, tone = 'default' }: CardProps) {
  const palette = TONES[tone];
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    ...(shadows.card as object),
  },
  padded: {
    padding: spacing.lg,
  },
});
