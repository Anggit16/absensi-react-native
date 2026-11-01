import { ChevronLeft, LayoutGrid, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';

interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  accessibilityLabel: string;
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  icon: Icon,
  onPress,
  color = colors.primary,
  backgroundColor = colors.surfaceMuted,
  size = 40,
  accessibilityLabel,
  badgeCount,
  style,
  disabled,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon size={size * 0.48} color={color} strokeWidth={2.2} />
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  onMenu?: () => void;
  right?: React.ReactNode;
  leading?: React.ReactNode;
  dark?: boolean;
  borderless?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  onMenu,
  right,
  leading,
  dark = false,
  borderless = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const textColor = dark ? colors.textOnDark : colors.text;
  const subColor = dark ? colors.textOnDarkMuted : colors.textMuted;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: dark ? colors.primary : colors.background,
          borderBottomColor: borderless ? colors.transparent : colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {onBack ? (
          <IconButton
            icon={ChevronLeft}
            onPress={onBack}
            accessibilityLabel="Kembali"
            color={textColor}
            backgroundColor={dark ? 'rgba(248,250,252,0.14)' : colors.surface}
            style={!dark && styles.bordered}
          />
        ) : null}
        {leading}
        <View style={styles.headerText}>
          {eyebrow ? (
            <AppText style={{ color: subColor, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
              {eyebrow.toUpperCase()}
            </AppText>
          ) : null}
          <AppText
            style={{ color: textColor, fontSize: 18, fontWeight: '700' }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={{ color: subColor, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {onMenu ? (
          <IconButton
            icon={LayoutGrid}
            onPress={onMenu}
            accessibilityLabel="Buka menu modul"
            color={textColor}
            backgroundColor={dark ? 'rgba(248,250,252,0.14)' : colors.surface}
            style={!dark && styles.bordered}
          />
        ) : null}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  bordered: { borderWidth: 1, borderColor: colors.border },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
