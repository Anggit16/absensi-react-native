import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  ScanFace,
  Timer,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { FilterChips } from '../../components/common/SegmentedTabs';
import { StatCard } from '../../components/common/StatCard';
import { AttendanceRow } from '../../components/attendance/AttendanceRow';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { currentPeriod, formatPeriod, periodBounds, shiftPeriod } from '../../utils/date';
import { summaryFromAttendance } from '../../utils/payroll';
import type { AttendanceStatus } from '../../types';
import { useAppNavigation } from '../../navigation/types';

type StatusFilter = 'ALL' | AttendanceStatus;

export function AttendanceHistoryScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { attendances, submissions, getRoleForUser } = useApp();

  const [period, setPeriod] = useState(currentPeriod());
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const role = getRoleForUser(user);
  const bounds = periodBounds(period);

  const monthRecords = useMemo(
    () =>
      attendances
        .filter(
          (record) =>
            record.userId === user.id && record.date >= bounds.start && record.date <= bounds.end,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [attendances, bounds.end, bounds.start, user.id],
  );

  const summary = useMemo(() => summaryFromAttendance(monthRecords), [monthRecords]);
  const totalLateMinutes = monthRecords.reduce((total, record) => total + record.lateMinutes, 0);

  const filtered = useMemo(
    () => (status === 'ALL' ? monthRecords : monthRecords.filter((record) => record.status === status)),
    [monthRecords, status],
  );

  const pendingLeave = useMemo(
    () =>
      submissions.filter(
        (item) => item.userId === user.id && item.status === 'PENDING_OWNER' && item.type === 'LEAVE',
      ).length,
    [submissions, user.id],
  );

  const nextDisabled = period >= currentPeriod();

  return (
    <Screen
      header={
        <ScreenHeader
          title="Riwayat absensi"
          subtitle={`${role?.name ?? 'Karyawan'} · ${user.employeeCode}`}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card padded={false} style={styles.periodCard}>
        <Pressable
          onPress={() => setPeriod((value) => shiftPeriod(value, -1))}
          accessibilityLabel="Bulan sebelumnya"
          style={styles.periodButton}
        >
          <ChevronLeft size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.periodLabel}>
          <AppText variant="caption">Periode absensi</AppText>
          <AppText variant="subtitle">{formatPeriod(period)}</AppText>
        </View>
        <Pressable
          onPress={() => setPeriod((value) => shiftPeriod(value, 1))}
          disabled={nextDisabled}
          accessibilityLabel="Bulan berikutnya"
          style={[styles.periodButton, { opacity: nextDisabled ? 0.35 : 1 }]}
        >
          <ChevronRight size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Hadir"
          value={`${summary.onTime + summary.late} hari`}
          icon={ScanFace}
          tone="success"
          hint={`${summary.onTime} tepat waktu`}
        />
        <StatCard
          label="Terlambat"
          value={`${summary.late} hari`}
          icon={Clock3}
          tone="warning"
          hint={`${totalLateMinutes} menit total`}
        />
      </View>
      <View style={[styles.statRow, { marginTop: spacing.sm }]}>
        <StatCard
          label="Cuti / izin"
          value={`${summary.onLeave} hari`}
          icon={CalendarDays}
          tone="info"
          hint={pendingLeave > 0 ? `${pendingLeave} menunggu Owner` : 'Tercatat sistem'}
        />
        <StatCard
          label="Tidak hadir"
          value={`${summary.absent} hari`}
          icon={Timer}
          tone={summary.absent > 0 ? 'danger' : 'neutral'}
          hint="Tanpa konfirmasi"
        />
      </View>

      <FilterChips
        style={{ marginTop: spacing.md }}
        value={status}
        onChange={(value) => setStatus(value as StatusFilter)}
        options={[
          { value: 'ALL', label: 'Semua', count: monthRecords.length },
          { value: 'ON_TIME', label: 'Tepat waktu', count: summary.onTime },
          { value: 'LATE', label: 'Terlambat', count: summary.late },
          { value: 'ON_LEAVE', label: 'Cuti', count: summary.onLeave },
          { value: 'ABSENT', label: 'Absen', count: summary.absent },
        ]}
      />

      <View style={styles.list}>
        {filtered.map((record) => (
          <AttendanceRow
            key={record.id}
            record={record}
            user={user}
            roleName={role?.name}
            showDate
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScanFace}
          title="Tidak ada catatan absensi"
          description={
            monthRecords.length === 0
              ? `Belum ada data kehadiran pada ${formatPeriod(period)} untuk akun ini.`
              : 'Tidak ada catatan yang cocok dengan filter status yang dipilih.'
          }
        />
      ) : null}

      <Card style={styles.legendCard}>
        <AppText variant="caption" style={styles.legendTitle}>
          CATATAN
        </AppText>
        <View style={styles.legendRow}>
          <Badge label="Tepat waktu" tone="success" />
          <AppText variant="caption" style={{ flex: 1 }}>
            Masuk sebelum batas toleransi role.
          </AppText>
        </View>
        <View style={styles.legendRow}>
          <Badge label="Terlambat" tone="warning" />
          <AppText variant="caption" style={{ flex: 1 }}>
            Melebihi batas toleransi; denda masuk rekap payroll.
          </AppText>
        </View>
        <View style={styles.legendRow}>
          <Badge label="Cuti / izin" tone="info" />
          <AppText variant="caption" style={{ flex: 1 }}>
            Berasal dari pengajuan yang disetujui penuh.
          </AppText>
        </View>
        <View style={styles.legendRow}>
          <Badge label="Absen" tone="danger" />
          <AppText variant="caption" style={{ flex: 1 }}>
            Tidak ada konfirmasi kehadiran pada hari kerja.
          </AppText>
        </View>
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        body="Data riwayat hanya mencakup absensi akun ini. Perhitungan hari kerja belum mengecualikan hari libur nasional."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  periodButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  periodLabel: { alignItems: 'center', gap: 1 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  list: { gap: spacing.sm, marginTop: spacing.md },
  legendCard: { marginTop: spacing.md, gap: spacing.sm },
  legendTitle: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
