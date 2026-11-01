import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 40, md: layout.buttonHeight, lg: 54 };
const FONT_SIZE: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 15 };

const VARIANTS: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  secondary: { bg: colors.surfaceMuted, border: colors.border, text: colors.primary },
  outline: { bg: colors.white, border: colors.borderStrong, text: colors.primary },
  ghost: { bg: colors.transparent, border: colors.transparent, text: colors.primary },
  success: { bg: colors.accent, border: colors.accent, text: colors.white },
  danger: { bg: colors.danger, border: colors.danger, text: colors.white },
  warning: { bg: colors.warning, border: colors.warning, text: colors.white },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const isDisabled = disabled || loading;
  const contentColor = isDisabled && variant !== 'secondary' ? colors.textMuted : palette.text;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHTS[size],
          backgroundColor: isDisabled ? colors.surfaceMuted : palette.bg,
          borderColor: isDisabled ? colors.border : palette.border,
          opacity: pressed && !isDisabled ? 0.88 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'success' ? colors.white : colors.primary} />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' ? (
            <Icon size={iconSize} color={contentColor} strokeWidth={2.2} />
          ) : null}
          <AppText
            style={{
              fontSize: FONT_SIZE[size],
              fontWeight: '700',
              color: contentColor,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {Icon && iconPosition === 'right' ? (
            <Icon size={iconSize} color={contentColor} strokeWidth={2.2} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
