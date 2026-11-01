import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Fingerprint,
  Info,
  LogOut,
  MapPin,
  ScanFace,
  Timer,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { LEAVE_POLICY_RULES } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { currentPeriod, formatDateLong, formatDayName, todayISO } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { computePayrollRow, summaryFromAttendance } from '../../utils/payroll';
import { useAppNavigation } from '../../navigation/types';

export function EmployeeDashboardScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { company, attendances, submissions, getRoleForUser, getLocationForUser, getBalance } =
    useApp();

  const today = todayISO();
  const period = currentPeriod();
  const role = getRoleForUser(user);
  const location = getLocationForUser(user);
  const balance = getBalance(user.id);

  const todayRecord = attendances.find(
    (record) => record.userId === user.id && record.date === today,
  );

  const myRecords = useMemo(
    () => attendances.filter((record) => record.userId === user.id),
    [attendances, user.id],
  );

  const monthRecords = useMemo(
    () => myRecords.filter((record) => record.date.slice(0, 7) === period),
    [myRecords, period],
  );

  const summary = useMemo(() => summaryFromAttendance(monthRecords), [monthRecords]);

  const mySubmissions = useMemo(
    () =>
      submissions
        .filter((submission) => submission.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [submissions, user.id],
  );

  const pendingCount = mySubmissions.filter((submission) =>
    ['PENDING_HRD', 'PENDING_OWNER'].includes(submission.status),
  ).length;

  const payroll = useMemo(() => {
    if (!role) return undefined;
    return computePayrollRow({
      user,
      role,
      attendances,
      submissions,
      company,
      period,
    });
  }, [attendances, company, period, role, submissions, user]);

  const remaining = balance ? balance.totalQuota - balance.used : 0;
  const usagePercent = balance?.totalQuota
    ? Math.round(((balance.totalQuota - remaining) / balance.totalQuota) * 100)
    : 0;

  const nextShift = todayRecord?.checkInAt
    ? todayRecord.checkOutAt
      ? 'Absensi hari ini selesai'
      : `Sudah masuk ${todayRecord.checkInAt} · jangan lupa absen pulang`
    : `Jadwal masuk ${role?.checkInTime ?? '—'} · ${role?.checkOutTime ?? '—'}`;

  return (
    <Screen
      header={
        <ScreenHeader
          title={`Halo, ${user.name.split(' ')[0]}`}
          eyebrow={user.employeeCode}
          subtitle={`${formatDateLong(today)}`}
          right={<Avatar name={user.name} size={40} />}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <AppText style={styles.heroEyebrow}>STATUS ABSENSI HARI INI</AppText>
            <AppText style={styles.heroValue}>
              {todayRecord?.checkInAt ? todayRecord.checkInAt : 'Belum absen'}
            </AppText>
            <AppText style={styles.heroHint}>{nextShift}</AppText>
          </View>
          <View style={styles.heroIcon}>
            <Fingerprint size={24} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.heroMetaRow}>
          <Badge
            label={
              todayRecord
                ? todayRecord.status === 'ON_TIME'
                  ? 'Tepat waktu'
                  : todayRecord.status === 'LATE'
                    ? `Terlambat ${todayRecord.lateMinutes} menit`
                    : todayRecord.status === 'ON_LEAVE'
                      ? 'Cuti / izin'
                      : 'Tidak hadir'
                : 'Belum ada catatan'
            }
            tone={
              todayRecord
                ? todayRecord.status === 'ON_TIME'
                  ? 'dark'
                  : todayRecord.status === 'LATE'
                    ? 'warning'
                    : todayRecord.status === 'ON_LEAVE'
                      ? 'info'
                      : 'danger'
                : 'dark'
            }
          />
          <Badge label={location?.name ?? 'Lokasi belum diatur'} tone="dark" />
        </View>
        <Button
          label={todayRecord?.checkInAt ? (todayRecord.checkOutAt ? 'Lihat riwayat absensi' : 'Absen pulang sekarang') : 'Absen masuk sekarang'}
          variant="success"
          icon={ScanFace}
          onPress={() =>
            todayRecord?.checkInAt && todayRecord.checkOutAt
              ? navigation.navigate('AttendanceHistory')
              : navigation.navigate('Attendance')
          }
        />
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Hadir bulan ini"
          value={`${summary.onTime + summary.late} hari`}
          icon={CheckCircle2}
          tone="success"
          hint={`${summary.late} terlambat`}
        />
        <StatCard
          label="Sisa cuti"
          value={`${remaining} hari`}
          icon={CalendarCheck}
          tone={remaining <= 3 ? 'warning' : 'violet'}
          hint={`dari ${balance?.totalQuota ?? 0} hari`}
          onPress={() => navigation.navigate('LeaveAllocation')}
        />
      </View>

      <Card style={styles.balanceCard}>
        <View style={styles.rowBetween}>
          <View>
            <AppText variant="subtitle">Kuota cuti tahunan {balance?.year ?? ''}</AppText>
            <AppText variant="caption">
              {balance?.used ?? 0} hari terpakai · sisa {remaining} hari
            </AppText>
          </View>
          <Badge label={`${usagePercent}% terpakai`} tone={usagePercent > 75 ? 'warning' : 'success'} />
        </View>
        <ProgressBar
          value={usagePercent}
          tone={usagePercent > 75 ? 'warning' : 'accent'}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <SectionHeader title="Aksi cepat" subtitle="Absensi & pengajuan" />
      <QuickActions
        actions={[
          {
            label: 'Absensi',
            icon: ScanFace,
            tone: 'accent',
            onPress: () => navigation.navigate('Attendance'),
          },
          {
            label: 'Ajukan cuti',
            icon: CalendarDays,
            tone: 'info',
            onPress: () => navigation.navigate('SubmissionCreate'),
          },
          {
            label: 'Pengajuan saya',
            icon: ClipboardList,
            tone: 'violet',
            onPress: () => navigation.navigate('Submissions'),
            badge: pendingCount || undefined,
          },
          {
            label: 'Riwayat absen',
            icon: Timer,
            tone: 'warning',
            onPress: () => navigation.navigate('AttendanceHistory'),
          },
        ]}
      />

      <SectionHeader
        title="Pengajuan terakhir"
        subtitle={`${pendingCount} pengajuan masih diproses`}
        actionLabel="Lihat semua"
        onAction={() => navigation.navigate('Submissions')}
      />
      {mySubmissions.slice(0, 2).map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
        />
      ))}
      {mySubmissions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <ClipboardList size={20} color={colors.textMuted} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Belum ada pengajuan</AppText>
            <AppText variant="caption">
              Ajukan cuti, izin, sakit, atau resign melalui menu pengajuan.
            </AppText>
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Ringkasan payroll" subtitle={`Periode ${period}`} />
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption">AKUMULASI GAJI (SIMULASI)</AppText>
            <AppText variant="numberLg" color={colors.accentDark}>
              {formatCurrency(payroll?.grossEarned ?? 0)}
            </AppText>
            <AppText variant="caption">
              {payroll?.presentDays ?? 0} hari hadir · {payroll?.lateMinutes ?? 0} menit terlambat
            </AppText>
          </View>
          <View style={styles.payrollIcon}>
            <Clock3 size={20} color={colors.primary} strokeWidth={2} />
          </View>
        </View>
        <Button
          label="Buka halaman payroll"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('Payroll')}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <SectionHeader title="Aturan cuti" subtitle="Dipakai pada pengajuan & payroll demo" />
      <Card style={styles.policyCard}>
        {LEAVE_POLICY_RULES.slice(0, 4).map((rule) => (
          <View key={rule.title} style={styles.policyRow}>
            <Info size={13} color={colors.info} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <AppText variant="smallStrong">{rule.title}</AppText>
              <AppText variant="caption" style={{ lineHeight: 16 }}>
                {rule.body}
              </AppText>
            </View>
          </View>
        ))}
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={MapPin}
        tone="neutral"
        title={`Lokasi kerja: ${location?.name ?? 'belum diatur'}`}
        body={`Radius geofencing demo ${location?.radiusMeters ?? 0} m. Absensi memakai simulasi GPS & selfie, bukan verifikasi perangkat asli.`}
      />
      <AppText variant="caption" align="center" style={styles.footnote}>
        {company.name} · {formatDayName(today)} · data simulasi
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroText: { flex: 1, gap: 3 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, lineHeight: 17, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  balanceCard: { marginTop: spacing.md },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  payrollIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyCard: { gap: spacing.sm },
  policyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  footnote: { marginTop: spacing.md, color: colors.textMuted, fontSize: 10.5 },
});
