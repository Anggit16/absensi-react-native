import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  ACCOUNT_STATUS_META,
  ATTENDANCE_STATUS_META,
  BadgeTone,
  ROLE_LABEL,
  SUBMISSION_STATUS_META,
} from '../../constants';
import type { AccountStatus, AttendanceStatus, SubmissionStatus, UserRole } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

interface TonePalette {
  background: string;
  text: string;
  dot: string;
}

export const TONE_PALETTE: Record<BadgeTone | 'dark', TonePalette> = {
  success: { background: colors.accentSoft, text: colors.accentDark, dot: colors.accent },
  warning: { background: colors.warningSoft, text: colors.warningDark, dot: colors.warning },
  danger: { background: colors.dangerSoft, text: colors.dangerDark, dot: colors.danger },
  info: { background: colors.infoSoft, text: colors.infoDark, dot: colors.info },
  neutral: { background: colors.surfaceMuted, text: colors.textSecondary, dot: colors.textMuted },
  primary: { background: '#E2E8F0', text: colors.primary, dot: colors.primary },
  violet: { background: colors.violetSoft, text: '#5B21B6', dot: colors.violet },
  dark: { background: 'rgba(248, 250, 252, 0.14)', text: colors.textOnDark, dot: colors.accent },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone | 'dark';
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'neutral', size = 'sm', dot = false, style }: BadgeProps) {
  const palette = TONE_PALETTE[tone];
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.background,
          paddingVertical: size === 'sm' ? 3 : 5,
          paddingHorizontal: size === 'sm' ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: palette.dot }]} /> : null}
      <AppText
        style={{
          color: palette.text,
          fontSize: size === 'sm' ? 11 : 12,
          fontWeight: '700',
          letterSpacing: 0.1,
        }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const meta = ATTENDANCE_STATUS_META[status];
  return <Badge label={meta.label} tone={meta.tone} dot />;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const meta = SUBMISSION_STATUS_META[status];
  return <Badge label={meta.label} tone={meta.tone} dot />;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const meta = ACCOUNT_STATUS_META[status];
  return <Badge label={meta.label} tone={meta.tone} />;
}

export function RoleBadge({ role, size = 'sm' }: { role: UserRole; size?: 'sm' | 'md' }) {
  const tone: BadgeTone = role === 'OWNER' ? 'violet' : role === 'HRD' ? 'info' : 'neutral';
  return <Badge label={ROLE_LABEL[role]} tone={tone} size={size} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
