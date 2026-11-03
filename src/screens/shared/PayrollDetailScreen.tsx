import { RouteProp, useRoute } from '@react-navigation/native';
import { CalendarDays, Info } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge , AttendanceStatusBadge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { useApp } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { formatDate, formatPeriod, formatPeriodRange, periodBounds } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import type { PayrollRow } from '../../types';
import { PayrollBreakdown } from './PayrollScreen';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function PayrollDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'PayrollDetail'>>();
  const navigation = useAppNavigation();
  const { userId, period } = route.params;
  const { getUser, attendances, fetchPayroll, payroll, getLocationForUser } = useApp();

  const user = getUser(userId);
  const location = getLocationForUser(user);

  const row = useMemo<PayrollRow | undefined>(
    () => payroll?.rows.find((item) => item.userId === userId),
    [payroll, userId],
  );

  useEffect(() => {
    void fetchPayroll(period);
  }, [fetchPayroll, period]);

  const records = useMemo(() => {
    const bounds = periodBounds(period);
    return attendances
      .filter((record) => record.userId === userId && record.date >= bounds.start && record.date <= bounds.end)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendances, period, userId]);

  if (!user || !row) {
    return (
      <Screen header={<ScreenHeader title="Rincian payroll" onBack={() => navigation.goBack()} />}>
        <EmptyState icon={Info} title="Data tidak ditemukan" description="Karyawan atau komponen gaji tidak tersedia." />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title={user.name}
          subtitle={`${formatPeriod(period)} · ${user.employeeCode}`}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.identity}>
        <Avatar name={user.name} size={52} />
        <View style={styles.identityText}>
          <AppText variant="subtitle">{user.name}</AppText>
          <AppText variant="caption">
            {row.roleName} · {location?.name ?? 'Lokasi belum diatur'}
          </AppText>
          <View style={styles.badgeRow}>
            <Badge label={formatPeriodRange(period)} tone="neutral" />
            <Badge label={row.kind === 'HRD' ? 'Gaji bulanan tetap' : 'Perhitungan harian'} tone="info" />
          </View>
        </View>
      </Card>

      <Card tone="dark" style={styles.hero}>
        <AppText style={styles.heroEyebrow}>TOTAL PAYROLL</AppText>
        <AppText style={styles.heroValue}>{formatCurrency(row.grossEarned)}</AppText>
        <AppText style={styles.heroHint}>
          Proyeksi penuh: {formatCurrency(row.projectedGross)} · {row.presentDays} hari hadir
        </AppText>
      </Card>

      <SectionHeader title="Rincian komponen" subtitle="Perhitungan berdasarkan absensi & role" />
      <Card>
        <PayrollBreakdown row={row} />
      </Card>

      <SectionHeader title="Data pendukung" />
      <Card>
        <DetailRow label="Gaji pokok (role)" value={formatCurrency(row.monthlyBaseSalary)} />
        <Divider />
        <DetailRow label="Gaji pokok harian" value={formatCurrency(row.dailyBaseSalary)} />
        <DetailRow label="Hari kerja asumsi" value={`${row.workDaysPerMonth} hari/bulan`} />
        <DetailRow label="Hari hadir" value={`${row.presentDays} hari`} />
        <DetailRow label="On time / terlambat" value={`${row.onTimeDays} / ${row.lateDays} hari`} />
        <DetailRow label="Total menit terlambat" value={`${row.lateMinutes} menit`} />
        <DetailRow label="Cuti tanpa gaji" value={`${row.unpaidLeaveDays} hari`} />
      </Card>

      {row.kind === 'EMPLOYEE' ? (
        <>
          <SectionHeader title="Absensi periode ini" subtitle={`${records.length} catatan`} />
          {records.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada absensi"
              description="Tidak ada catatan kehadiran pada periode ini."
            />
          ) : (
            <Card padded={false}>
              {records.slice(0, 12).map((record, index) => (
                <View
                  key={record.id}
                  style={[styles.recordRow, index < Math.min(records.length, 12) - 1 && styles.recordBorder]}
                >
                  <View style={styles.recordDate}>
                    <AppText variant="smallStrong">{formatDate(record.date)}</AppText>
                    <AppText variant="caption">
                      Masuk {record.checkInAt ?? '—'} · Pulang {record.checkOutAt ?? '—'}
                    </AppText>
                  </View>
                  <View style={styles.recordRight}>
                    {record.lateMinutes > 0 ? <Badge label={`+${record.lateMinutes} mnt`} tone="warning" /> : null}
                    <AttendanceStatusBadge status={record.status} />
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      ) : (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={Info}
          tone="neutral"
          body="Staf HRD menerima gaji bulanan tetap sehingga tidak dihitung dari absensi harian."
        />
      )}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="warning"
        title="Bukan slip gaji resmi"
        body="Belum ada pajak, BPJS, lembur, atau komponen resmi lain dari tim payroll."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  hero: { marginTop: spacing.md, gap: 2 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recordBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recordDate: { gap: 2, flex: 1 },
  recordRight: { alignItems: 'flex-end', gap: 4 },
});
