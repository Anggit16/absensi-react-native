import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Icon size={26} color={colors.textMuted} strokeWidth={1.8} />
      </View>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="small" align="center" style={styles.emptyDescription}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="sm" fullWidth={false} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function LoadingState({ message = 'Memuat data…' }: { message?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="small">{message}</AppText>
    </View>
  );
}

const TONES = {
  info: { bg: colors.infoSoft, border: '#BFDBFE', text: colors.infoDark, icon: colors.info },
  success: { bg: colors.accentSubtle, border: colors.accentSoft, text: colors.accentDark, icon: colors.accent },
  warning: { bg: colors.warningSoft, border: '#FDE68A', text: colors.warningDark, icon: colors.warning },
  danger: { bg: colors.dangerSoft, border: '#FECACA', text: colors.dangerDark, icon: colors.danger },
  neutral: { bg: colors.surfaceMuted, border: colors.border, text: colors.textSecondary, icon: colors.textMuted },
} as const;

export function InfoNote({
  title,
  body,
  tone = 'info',
  icon,
  style,
}: {
  title?: string;
  body: string;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.note,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      {icon ? (
        <View style={styles.noteIcon}>
          {React.createElement(icon, { size: 16, color: palette.icon, strokeWidth: 2.2 })}
        </View>
      ) : null}
      <View style={styles.flex}>
        {title ? (
          <AppText style={{ fontSize: 12, fontWeight: '700', color: palette.text, marginBottom: 2 }}>
            {title}
          </AppText>
        ) : null}
        <AppText style={{ fontSize: 12, lineHeight: 18, color: palette.text }}>{body}</AppText>
      </View>
    </View>
  );
}

export function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.inlineError}>
      <AppText style={{ color: colors.dangerDark, fontSize: 12, fontWeight: '600' }}>{message}</AppText>
    </View>
  );
}

export function ProgressBar({
  value,
  tone = 'accent',
  height = 8,
  style,
}: {
  value: number;
  tone?: 'accent' | 'warning' | 'danger' | 'primary' | 'info';
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    accent: colors.accent,
    warning: colors.warning,
    danger: colors.danger,
    primary: colors.primary,
    info: colors.info,
  }[tone];
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }, style]}>
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: palette,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function MiniBarChart({
  data,
}: {
  data: { label: string; value: number; tone?: 'accent' | 'warning' | 'danger' | 'info' | 'neutral' }[];
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <View style={styles.chart}>
      {data.map((item) => {
        const height = Math.max(4, Math.round((item.value / max) * 64));
        const color =
          item.tone === 'warning'
            ? colors.warning
            : item.tone === 'danger'
              ? colors.danger
              : item.tone === 'info'
                ? colors.info
                : item.tone === 'neutral'
                  ? colors.borderStrong
                  : colors.accent;
        return (
          <View key={item.label} style={styles.chartColumn}>
            <AppText style={styles.chartValue}>{item.value}</AppText>
            <View style={[styles.chartBar, { height, backgroundColor: color }]} />
            <AppText style={styles.chartLabel}>{item.label}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyDescription: { maxWidth: 300, color: colors.textSecondary },
  emptyAction: { marginTop: spacing.sm },
  loading: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noteIcon: { paddingTop: 1 },
  inlineError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    width: '100%',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  chartValue: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  chartBar: { width: '70%', minWidth: 10, borderRadius: radius.xs },
  chartLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
});
