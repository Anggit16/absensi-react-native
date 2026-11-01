import { ChevronRight, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionText}>
        <AppText variant="subtitle">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" style={styles.sectionSubtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppText style={styles.actionText}>{actionLabel}</AppText>
          <ChevronRight size={14} color={colors.accentDark} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value?: string;
  valueColor?: string;
  icon?: LucideIcon;
  strong?: boolean;
  multiline?: boolean;
}

export function DetailRow({ label, value, valueColor, icon: Icon, strong, multiline }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        {Icon ? <Icon size={14} color={colors.textMuted} strokeWidth={2} /> : null}
        <AppText variant="small" style={styles.detailLabelText}>
          {label}
        </AppText>
      </View>
      <AppText
        variant={strong ? 'bodyStrong' : 'body'}
        color={valueColor ?? colors.text}
        style={[styles.detailValue, multiline ? styles.detailValueMultiline : null]}
      >
        {value ?? '-'}
      </AppText>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function PillRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.pillRow, style]}>{children}</View>;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        accessibilityLabel="Kurangi"
        style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <AppText style={styles.stepperSymbol}>−</AppText>
      </Pressable>
      <AppText variant="bodyStrong" style={styles.stepperValue}>
        {value}
        {suffix ? ` ${suffix}` : ''}
      </AppText>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        accessibilityLabel="Tambah"
        style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}
      >
        <AppText style={styles.stepperSymbol}>+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionText: { flex: 1 },
  sectionSubtitle: { marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  detailLabelText: { color: colors.textSecondary },
  detailValue: { flexShrink: 1, textAlign: 'right', flexGrow: 1 },
  detailValueMultiline: { textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  stepperSymbol: { fontSize: 20, fontWeight: '700', color: colors.primary },
  stepperValue: { minWidth: 74, textAlign: 'center' },
});
