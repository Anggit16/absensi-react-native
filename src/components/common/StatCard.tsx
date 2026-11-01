import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BadgeTone } from '../../constants';
import { TONE_PALETTE } from './Badge';
import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from './AppText';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  hint?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint, onPress, style }: StatCardProps) {
  const palette = TONE_PALETTE[tone];
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <AppText variant="caption" style={styles.label} numberOfLines={2}>
          {label}
        </AppText>
        <View style={[styles.iconWrap, { backgroundColor: palette.background }]}>
          <Icon size={16} color={palette.text} strokeWidth={2.2} />
        </View>
      </View>
      <AppText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" numberOfLines={1} style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.8 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    ...(shadows.card as object),
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  label: { flex: 1, lineHeight: 15, color: colors.textSecondary, fontWeight: '600' },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  hint: { color: colors.textMuted, fontSize: 10.5 },
});
