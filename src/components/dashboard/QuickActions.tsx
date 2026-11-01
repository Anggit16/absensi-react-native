import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from '../common/AppText';

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  tone?: 'primary' | 'accent' | 'warning' | 'info' | 'violet';
  badge?: number;
}

const TONES = {
  primary: { bg: '#E2E8F0', fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: colors.accentDark },
  warning: { bg: colors.warningSoft, fg: colors.warningDark },
  info: { bg: colors.infoSoft, fg: colors.infoDark },
  violet: { bg: colors.violetSoft, fg: '#6D28D9' },
} as const;

export function QuickActions({
  actions,
  style,
}: {
  actions: QuickAction[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.grid, style]}>
      {actions.map((action) => {
        const palette = TONES[action.tone ?? 'accent'];
        const Icon = action.icon;
        return (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.icon, { backgroundColor: palette.bg }]}>
              <Icon size={19} color={palette.fg} strokeWidth={2.1} />
              {action.badge ? (
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>{action.badge}</AppText>
                </View>
              ) : null}
            </View>
            <AppText style={styles.label} numberOfLines={2}>
              {action.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '23%', minWidth: 72, alignItems: 'center', gap: 6 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
});
