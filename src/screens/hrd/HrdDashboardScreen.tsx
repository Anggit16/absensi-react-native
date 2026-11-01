import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  MapPin,
  ScanFace,
  UserPlus,
  Users,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { InfoNote, MiniBarChart, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { addDays, formatDateLong, todayISO } from '../../utils/date';
import { summaryFromAttendance } from '../../utils/payroll';
import { useAppNavigation } from '../../navigation/types';

export function HrdDashboardScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, roles, locations, attendances, submissions, leaveBalances, company } = useApp();

  const today = todayISO();

  const activeEmployees = useMemo(
    () => users.filter((item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE'),
    [users],
  );

  const todayRecords = useMemo(
    () => attendances.filter((record) => record.date === today),
    [attendances, today],
  );

  const summary = useMemo(() => summaryFromAttendance(todayRecords), [todayRecords]);

  const notCheckedIn = useMemo(
    () =>
      activeEmployees.filter(
        (employee) => !todayRecords.some((record) => record.userId === employee.id),
      ),
    [activeEmployees, todayRecords],
  );

  const pending = useMemo(
    () =>
      submissions
        .filter((submission) => submission.status === 'PENDING_HRD')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [submissions],
  );

  const awaitingOwner = submissions.filter((submission) => submission.status === 'PENDING_OWNER').length;

  const weekly = useMemo(() => {
    const buckets = Array.from({ length: 5 }).map((_, index) => {
      const date = addDays(today, -(4 - index));
      const records = attendances.filter((record) => record.date === date);
      const present = records.filter(
        (record) => record.status === 'ON_TIME' || record.status === 'LATE',
      ).length;
      return {
        label: formatDateLong(date).split(',')[0].slice(0, 3),
        value: present,
        tone: 'accent' as const,
      };
    });
    return buckets;
  }, [attendances, today]);

  const attendanceRate = activeEmployees.length
    ? Math.round(((summary.onTime + summary.late) / activeEmployees.length) * 100)
    : 0;

  const lowBalance = useMemo(
    () =>
      activeEmployees
        .map((employee) => ({
          employee,
          balance: leaveBalances.find((item) => item.userId === employee.id),
        }))
        .filter((item) => item.balance && item.balance.totalQuota - item.balance.used <= 3),
    [activeEmployees, leaveBalances],
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={`Halo, ${user.name.split(' ')[0]}`}
          eyebrow="Dashboard HRD"
          subtitle={`${company.name} · ${formatDateLong(today)}`}
          onMenu={() => navigation.navigate('Menu')}
          right={<Avatar name={user.name} size={40} />}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <AppText style={styles.heroEyebrow}>REKAP KEHADIRAN HARI INI</AppText>
            <AppText style={styles.heroValue}>
              {summary.onTime + summary.late}
              <AppText style={styles.heroValueMuted}> / {activeEmployees.length}</AppText>
            </AppText>
            <AppText style={styles.heroHint}>
              {notCheckedIn.length} karyawan belum absen · {summary.late} terlambat ·{' '}
              {summary.onLeave} cuti
            </AppText>
          </View>
          <View style={styles.heroCircle}>
            <AppText style={styles.heroCircleValue}>{attendanceRate}%</AppText>
            <AppText style={styles.heroCircleLabel}>hadir</AppText>
          </View>
        </View>
        <ProgressBar value={attendanceRate} height={6} style={styles.heroProgress} />
        <View style={styles.heroFooter}>
          <Badge label={`${summary.absent} absen`} tone="danger" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka monitoring absensi"
            onPress={() => navigation.navigate('AttendanceMonitoring')}
            style={styles.heroLink}
          >
            <AppText style={styles.heroLinkText}>Monitoring lengkap</AppText>
            <ArrowRight size={13} color={colors.accent} strokeWidth={2.4} />
          </Pressable>
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Menunggu verifikasi"
          value={String(pending.length)}
          icon={ClipboardCheck}
          tone={pending.length > 0 ? 'warning' : 'success'}
          hint={`${awaitingOwner} menunggu Owner`}
          onPress={() => navigation.navigate('Approvals')}
        />
        <StatCard
          label="Karyawan aktif"
          value={String(activeEmployees.length)}
          icon={Users}
          tone="info"
          hint={`${users.filter((item) => item.status === 'INACTIVE').length} akun nonaktif`}
          onPress={() => navigation.navigate('EmployeeList')}
        />
      </View>

      <View style={styles.statRow}>
        <StatCard
          label="Belum absen"
          value={String(notCheckedIn.length)}
          icon={Clock3}
          tone={notCheckedIn.length > 0 ? 'warning' : 'success'}
          hint="Hari kerja berjalan"
        />
        <StatCard
          label="Kuota cuti kritis"
          value={String(lowBalance.length)}
          icon={CalendarCheck}
          tone={lowBalance.length > 0 ? 'danger' : 'success'}
          hint="Sisa ≤ 3 hari"
          onPress={() => navigation.navigate('LeaveAllocation')}
        />
      </View>

      <SectionHeader title="Aksi cepat" subtitle="Kelola data & operasional HRD" />
      <QuickActions
        actions={[
          {
            label: 'Tambah karyawan',
            icon: UserPlus,
            tone: 'accent',
            onPress: () => navigation.navigate('EmployeeForm'),
          },
          {
            label: 'Data karyawan',
            icon: Users,
            tone: 'info',
            onPress: () => navigation.navigate('EmployeeList'),
          },
          {
            label: 'Role & jam kerja',
            icon: Briefcase,
            tone: 'violet',
            onPress: () => navigation.navigate('RoleList'),
          },
          {
            label: 'Lokasi kerja',
            icon: MapPin,
            tone: 'warning',
            onPress: () => navigation.navigate('LocationList'),
          },
        ]}
      />

      <SectionHeader
        title="Perlu verifikasi Anda"
        subtitle={
          pending.length > 0
            ? `${pending.length} pengajuan menunggu tahap pertama`
            : 'Tidak ada pengajuan baru'
        }
        actionLabel="Lihat semua"
        onAction={() => navigation.navigate('Approvals')}
      />
      {pending.slice(0, 2).map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          user={users.find((item) => item.id === submission.userId)}
          showEmployee
          onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
        />
      ))}
      {pending.length === 0 ? (
        <Card style={styles.emptyCard}>
          <ClipboardCheck size={20} color={colors.accent} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Semua pengajuan sudah diverifikasi</AppText>
            <AppText variant="caption">Pengajuan baru dari karyawan akan muncul di sini.</AppText>
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Tren kehadiran 5 hari kerja" subtitle="Total karyawan hadir per hari" />
      <Card>
        <MiniBarChart data={weekly} />
        <View style={styles.chartLegend}>
          <AppText variant="caption">Rata-rata hadir</AppText>
          <AppText variant="smallStrong">
            {Math.round(weekly.reduce((total, item) => total + item.value, 0) / Math.max(1, weekly.length))}{' '}
            karyawan / hari
          </AppText>
        </View>
      </Card>

      {lowBalance.length > 0 ? (
        <>
          <SectionHeader title="Perlu perhatian" subtitle="Sisa cuti tahunan hampir habis" />
          <Card style={styles.alertCard}>
            {lowBalance.slice(0, 3).map(({ employee, balance }) => (
              <Pressable
                key={employee.id}
                onPress={() => navigation.navigate('LeaveAllocationDetail', { userId: employee.id })}
                accessibilityRole="button"
                accessibilityLabel={`Atur kuota cuti ${employee.name}`}
                style={({ pressed }) => [styles.alertRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <AlertTriangle size={15} color={colors.warningDark} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <AppText variant="smallStrong">{employee.name}</AppText>
                  <AppText variant="caption">
                    Sisa {balance ? balance.totalQuota - balance.used : 0} hari dari{' '}
                    {balance?.totalQuota ?? 0} hari
                  </AppText>
                </View>
                <Badge label="Atur" tone="warning" />
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ScanFace}
        tone="neutral"
        title={`${roles.length} role · ${locations.length} titik lokasi`}
        body="Semua data berasal dari mock state yang sama. Setelah Anda memverifikasi pengajuan, pengajuan langsung muncul di daftar Owner bila disetujui."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroText: { flex: 1, gap: 3 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.white },
  heroValueMuted: { fontSize: 13, fontWeight: '500', color: colors.textOnDarkMuted },
  heroHint: { fontSize: 11.5, lineHeight: 17, color: colors.textOnDarkMuted },
  heroCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircleValue: { fontSize: 17, fontWeight: '700', color: colors.accent },
  heroCircleLabel: { fontSize: 9, color: colors.textOnDarkMuted },
  heroProgress: { backgroundColor: 'rgba(248,250,252,0.16)' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroLinkText: { fontSize: 11.5, fontWeight: '700', color: colors.accent },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  alertCard: { gap: spacing.sm },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
