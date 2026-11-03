import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Coins,
  MapPin,
  ScanFace,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
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
import type { PayrollRow } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { currentPeriod, formatDateLong, formatPeriod, todayISO } from '../../utils/date';
import { formatCompactCurrency, formatCurrency } from '../../utils/format';
import { computeHrdPayrollRow, computePayrollRow, summarizePayroll, summaryFromAttendance } from '../../utils/payroll';
import { useAppNavigation } from '../../navigation/types';

export function OwnerDashboardScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const {
    company,
    users,
    roles,
    locations,
    attendances,
    submissions,
    getRoleForUser,
    getCompensation,
    leaveBalances,
  } = useApp();

  const today = todayISO();
  const period = currentPeriod();

  const activeEmployees = useMemo(
    () => users.filter((item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE'),
    [users],
  );

  const todayRecords = useMemo(
    () => attendances.filter((record) => record.date === today),
    [attendances, today],
  );

  const summary = useMemo(() => summaryFromAttendance(todayRecords), [todayRecords]);

  const pendingOwner = useMemo(
    () => submissions.filter((submission) => submission.status === 'PENDING_OWNER'),
    [submissions],
  );
  const pendingHrd = useMemo(
    () => submissions.filter((submission) => submission.status === 'PENDING_HRD'),
    [submissions],
  );
  const approvedThisMonth = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.status === 'FULLY_APPROVED' && submission.startDate.slice(0, 7) === period,
      ),
    [period, submissions],
  );

  const payrollSummary = useMemo(() => {
    const employeeRows = activeEmployees
      .map((employee) => {
        const role = getRoleForUser(employee);
        if (!role) return null;
        return computePayrollRow({ user: employee, role, attendances, submissions, company, period });
      })
      .filter((row): row is PayrollRow => Boolean(row));

    const hrdRows = users
      .filter((item) => item.role === 'HRD' && item.status === 'ACTIVE')
      .map((item) => {
        const compensation = getCompensation(item.id);
        return compensation ? computeHrdPayrollRow(item, compensation, company, period) : null;
      })
      .filter((row): row is PayrollRow => Boolean(row));

    return summarizePayroll([...employeeRows, ...hrdRows]);
  }, [activeEmployees, attendances, company, getCompensation, getRoleForUser, period, submissions, users]);

  const attendanceRate = activeEmployees.length
    ? Math.round(((summary.onTime + summary.late) / activeEmployees.length) * 100)
    : 0;

  const totalRemaining = leaveBalances
    .filter((balance) => activeEmployees.some((employee) => employee.id === balance.userId))
    .reduce((total, balance) => total + (balance.totalQuota - balance.used), 0);

  return (
    <Screen
      header={
        <ScreenHeader
          title={`Halo, ${user.name.split(' ')[0]}`}
          eyebrow="Dashboard Owner"
          subtitle={`${company.name} · ${formatDateLong(today)}`}
          onMenu={() => navigation.navigate('Menu')}
          right={<Avatar name={user.name} size={40} />}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <AppText style={styles.heroEyebrow}>KEHADIRAN HARI INI</AppText>
            <AppText style={styles.heroValue}>
              {summary.onTime + summary.late}
              <AppText style={styles.heroValueMuted}> / {activeEmployees.length} karyawan</AppText>
            </AppText>
            <AppText style={styles.heroHint}>
              {summary.onTime} tepat waktu · {summary.late} terlambat · {summary.onLeave} cuti ·{' '}
              {summary.absent} absen
            </AppText>
          </View>
          <View style={styles.heroBadge}>
            <AppText style={styles.heroBadgeValue}>{attendanceRate}%</AppText>
            <AppText style={styles.heroBadgeLabel}>tingkat hadir</AppText>
          </View>
        </View>
        <ProgressBar value={attendanceRate} tone="accent" height={6} style={styles.heroProgress} />
        <View style={styles.heroFooter}>
          <Pressable
            onPress={() => navigation.navigate('AttendanceMonitoring')}
            accessibilityRole="button"
            accessibilityLabel="Buka monitoring absensi"
            style={styles.heroLink}
          >
            <ScanFace size={14} color={colors.accent} strokeWidth={2.2} />
            <AppText style={styles.heroLinkText}>Monitoring absensi</AppText>
            <ArrowRight size={13} color={colors.accent} strokeWidth={2.4} />
          </Pressable>
          <Badge label="Data terkini" tone="dark" />
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Menunggu approval"
          value={String(pendingOwner.length)}
          icon={ClipboardCheck}
          tone={pendingOwner.length > 0 ? 'warning' : 'success'}
          hint={`${pendingHrd.length} di tahap HRD`}
          onPress={() => navigation.navigate('Approvals')}
        />
        <StatCard
          label="Payroll bulan ini"
          value={formatCompactCurrency(payrollSummary.total)}
          icon={Coins}
          tone="primary"
          hint={formatPeriod(period)}
          onPress={() => navigation.navigate('Payroll')}
        />
      </View>

      <View style={styles.statRow}>
        <StatCard
          label="Karyawan aktif"
          value={String(activeEmployees.length)}
          icon={Users}
          tone="info"
          hint={`${users.filter((item) => item.role === 'HRD').length} akun HRD`}
          onPress={() => navigation.navigate('EmployeeList')}
        />
        <StatCard
          label="Sisa kuota cuti"
          value={`${totalRemaining} hari`}
          icon={CalendarCheck}
          tone="violet"
          hint={`${activeEmployees.length} karyawan`}
          onPress={() => navigation.navigate('LeaveAllocation')}
        />
      </View>

      <SectionHeader title="Aksi cepat" subtitle="Modul utama Owner" />
      <QuickActions
        actions={[
          {
            label: 'Manajemen HRD',
            icon: UserCog,
            tone: 'violet',
            onPress: () => navigation.navigate('HrdList'),
          },
          {
            label: 'Karyawan',
            icon: Users,
            tone: 'info',
            onPress: () => navigation.navigate('EmployeeList'),
          },
          {
            label: 'Lokasi Kerja',
            icon: MapPin,
            tone: 'accent',
            onPress: () => navigation.navigate('LocationList'),
          },
          {
            label: 'Pengaturan',
            icon: Building2,
            tone: 'primary',
            onPress: () => navigation.navigate('CompanySettings'),
          },
        ]}
      />

      <SectionHeader
        title="Persetujuan final"
        subtitle={
          pendingOwner.length > 0
            ? `${pendingOwner.length} pengajuan lolos HRD menunggu keputusan Anda`
            : 'Tidak ada pengajuan menunggu keputusan Owner'
        }
        actionLabel="Lihat semua"
        onAction={() => navigation.navigate('Approvals')}
      />
      {pendingOwner.slice(0, 3).map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          user={users.find((item) => item.id === submission.userId)}
          showEmployee
          onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
        />
      ))}
      {pendingOwner.length === 0 ? (
        <Card style={styles.emptyCard}>
          <ClipboardCheck size={20} color={colors.accent} strokeWidth={2} />
          <View style={styles.emptyText}>
            <AppText variant="bodyStrong">Semua pengajuan sudah diproses</AppText>
            <AppText variant="caption">
              Pengajuan yang ditolak HRD tidak akan masuk ke daftar Anda.
            </AppText>
          </View>
        </Card>
      ) : null}

      <SectionHeader
        title="Aktivitas absensi hari ini"
        subtitle={`${todayRecords.length} catatan kehadiran`}
        actionLabel="Detail"
        onAction={() => navigation.navigate('AttendanceMonitoring')}
      />
      <Card style={styles.activityCard}>
        {activeEmployees.slice(0, 5).map((employee) => {
          const record = todayRecords.find((item) => item.userId === employee.id);
          const role = getRoleForUser(employee);
          return (
            <Pressable
              key={employee.id}
              onPress={() => navigation.navigate('EmployeeDetail', { userId: employee.id })}
              accessibilityRole="button"
              accessibilityLabel={`Buka detail ${employee.name}`}
              style={({ pressed }) => [styles.activityRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Avatar name={employee.name} size={34} />
              <View style={styles.activityText}>
                <AppText variant="smallStrong" numberOfLines={1}>
                  {employee.name}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {role?.name ?? 'Karyawan'} · masuk {record?.checkInAt ?? '—'}
                </AppText>
              </View>
              <Badge
                label={
                  record
                    ? record.status === 'ON_TIME'
                      ? 'Tepat waktu'
                      : record.status === 'LATE'
                        ? `Telat ${record.lateMinutes}m`
                        : record.status === 'ON_LEAVE'
                          ? 'Cuti'
                          : 'Absen'
                    : 'Belum absen'
                }
                tone={
                  record
                    ? record.status === 'ON_TIME'
                      ? 'success'
                      : record.status === 'LATE'
                        ? 'warning'
                        : record.status === 'ON_LEAVE'
                          ? 'info'
                          : 'danger'
                    : 'neutral'
                }
              />
            </Pressable>
          );
        })}
      </Card>

      <SectionHeader title="Kebijakan cuti & payroll" subtitle="Ringkasan aturan yang dipakai aplikasi" />
      <Card style={styles.policyCard}>
        {LEAVE_POLICY_RULES.slice(0, 3).map((rule) => (
          <View key={rule.title} style={styles.policyRow}>
            <View style={styles.policyDot} />
            <View style={styles.policyText}>
              <AppText variant="smallStrong">{rule.title}</AppText>
              <AppText variant="caption" style={styles.policyBody}>
                {rule.body}
              </AppText>
            </View>
          </View>
        ))}
        <Pressable
          onPress={() => navigation.navigate('CompanySettings')}
          accessibilityRole="button"
          accessibilityLabel="Buka pengaturan perusahaan"
          style={styles.policyLink}
        >
          <AppText style={styles.policyLinkText}>Atur kebijakan perusahaan</AppText>
          <ArrowRight size={13} color={colors.accentDark} strokeWidth={2.4} />
        </Pressable>
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={UserRound}
        tone="neutral"
        title={`${roles.length} role · ${locations.length} lokasi · ${approvedThisMonth.length} cuti disetujui bulan ini`}
        body="Dashboard memakai data server yang sama dengan modul HRD dan karyawan. Perubahan langsung tercermin setelah aksi dilakukan."
      />
      <AppText variant="caption" align="center" style={styles.footnote}>
        Total payroll aktual {formatCurrency(payrollSummary.total)} · {payrollSummary.headcount} penerima
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
  heroValueMuted: { fontSize: 13, fontWeight: '500', color: colors.textOnDarkMuted },
  heroHint: { fontSize: 11.5, lineHeight: 17, color: colors.textOnDarkMuted },
  heroBadge: {
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  heroBadgeValue: { fontSize: 20, fontWeight: '700', color: colors.accent },
  heroBadgeLabel: { fontSize: 9, color: colors.textOnDarkMuted },
  heroProgress: { backgroundColor: 'rgba(248,250,252,0.16)' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLinkText: { fontSize: 11.5, fontWeight: '700', color: colors.accent },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyText: { flex: 1, gap: 2 },
  activityCard: { paddingVertical: spacing.xs },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  activityText: { flex: 1, gap: 1 },
  policyCard: { gap: spacing.sm },
  policyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  policyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  policyText: { flex: 1, gap: 1 },
  policyBody: { lineHeight: 16 },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  policyLinkText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  footnote: { marginTop: spacing.md, color: colors.textMuted, fontSize: 10.5 },
});
