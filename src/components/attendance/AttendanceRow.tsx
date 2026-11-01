import { ChevronRight, Clock, MapPin } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { Attendance, User } from '../../types';
import { formatDate } from '../../utils/date';
import { AppText } from '../common/AppText';
import { AttendanceStatusBadge, Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

interface AttendanceRowProps {
  record: Attendance;
  user?: User;
  roleName?: string;
  showDate?: boolean;
  onPress?: () => void;
}

export function AttendanceRow({ record, user, roleName, showDate = false, onPress }: AttendanceRowProps) {
  const name = user?.name ?? 'Karyawan';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Absensi ${name}, status ${record.status}`}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Avatar name={name} size={42} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          <AttendanceStatusBadge status={record.status} />
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {showDate ? formatDate(record.date) : roleName ?? user?.employeeCode ?? '-'}
          {showDate && roleName ? ` • ${roleName}` : ''}
        </AppText>
        <View style={styles.metaRow}>
          <Clock size={12} color={colors.textMuted} strokeWidth={2} />
          <AppText variant="caption">
            Masuk {record.checkInAt ?? '—'} • Pulang {record.checkOutAt ?? '—'}
          </AppText>
          {record.lateMinutes > 0 ? <Badge label={`+${record.lateMinutes} mnt`} tone="warning" /> : null}
        </View>
        {record.locationName ? (
          <View style={styles.metaRow}>
            <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
            <AppText variant="caption" numberOfLines={1} style={styles.location}>
              {record.locationName}
              {record.distanceMeters !== undefined ? ` • ±${record.distanceMeters} m` : ''}
            </AppText>
          </View>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  location: { flexShrink: 1 },
});
