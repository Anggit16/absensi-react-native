import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Info,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { FilterChips } from '../../components/common/SegmentedTabs';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { LEAVE_POLICY_RULES } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/date';
import { useAppNavigation } from '../../navigation/types';

type Filter = 'ALL' | 'LOW' | 'NORMAL';

export function LeaveAllocationScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, leaveBalances, submissions, getBalance, getRoleForUser } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const activeEmployees = useMemo(
    () => users.filter((item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE'),
    [users],
  );

  const rows = useMemo(
    () =>
      activeEmployees
        .map((employee) => {
          const balance = leaveBalances.find((item) => item.userId === employee.id);
          const remaining = balance ? balance.totalQuota - balance.used : 0;
          const annualApproved = submissions.filter(
            (submission) =>
              submission.userId === employee.id &&
              submission.type === 'LEAVE' &&
              submission.leaveCategory === 'ANNUAL' &&
              submission.status === 'FULLY_APPROVED',
          ).length;
          return {
            employee,
            balance,
            remaining,
            annualApproved,
            role: getRoleForUser(employee),
          };
        })
        .sort((a, b) => a.remaining - b.remaining),
    [activeEmployees, getRoleForUser, leaveBalances, submissions],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (accumulator, row) => ({
          quota: accumulator.quota + (row.balance?.totalQuota ?? 0),
          used: accumulator.used + (row.balance?.used ?? 0),
          remaining: accumulator.remaining + row.remaining,
        }),
        { quota: 0, used: 0, remaining: 0 },
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === 'LOW' && row.remaining > 3) return false;
      if (filter === 'NORMAL' && row.remaining <= 3) return false;
      if (!term) return true;
      return (
        row.employee.name.toLowerCase().includes(term) ||
        row.employee.employeeCode.toLowerCase().includes(term)
      );
    });
  }, [filter, rows, search]);

  if (user.role === 'EMPLOYEE') {
    const balance = getBalance(user.id);
    const remaining = balance ? balance.totalQuota - balance.used : 0;
    const usagePercent = balance?.totalQuota
      ? Math.round(((balance.totalQuota - remaining) / balance.totalQuota) * 100)
      : 0;

    return (
      <Screen
        header={
          <ScreenHeader
            title="Kuota cuti"
            subtitle={`Tahun ${balance?.year ?? new Date().getFullYear()} · data pribadi`}
            onBack={() => navigation.goBack()}
          />
        }
      >
        <Card tone="dark" style={styles.hero}>
          <AppText style={styles.heroEyebrow}>SISA CUTI TAHUNAN</AppText>
          <AppText style={styles.heroValue}>{remaining} hari</AppText>
          <AppText style={styles.heroHint}>
            Terpakai {balance?.used ?? 0} dari {balance?.totalQuota ?? 0} hari
          </AppText>
          <ProgressBar
            value={usagePercent}
            tone={usagePercent > 75 ? 'warning' : 'accent'}
            height={6}
            style={{ backgroundColor: 'rgba(248,250,252,0.16)', marginTop: spacing.sm }}
          />
        </Card>

        <SectionHeader title="Aturan pemotongan" subtitle="Berlaku pada pengajuan cuti" />
        <Card style={styles.policyCard}>
          {LEAVE_POLICY_RULES.map((rule) => (
            <View key={rule.title} style={styles.policyRow}>
              <CalendarCheck size={14} color={colors.accentDark} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <AppText variant="smallStrong">{rule.title}</AppText>
                <AppText variant="caption" style={{ lineHeight: 16 }}>
                  {rule.body}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <SectionHeader title="Riwayat penyesuaian" subtitle="Perubahan saldo oleh HRD" />
        <Card padded={false}>
          {balance && balance.adjustments.length > 0 ? (
            balance.adjustments.map((adjustment, index) => (
              <View
                key={adjustment.id}
                style={[
                  styles.adjustRow,
                  index < balance.adjustments.length - 1 && styles.adjustBorder,
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="smallStrong">{adjustment.reason}</AppText>
                  <AppText variant="caption">
                    {formatDate(adjustment.at.slice(0, 10))} · oleh {adjustment.byName}
                  </AppText>
                </View>
                <Badge
                  label={`${adjustment.delta > 0 ? '+' : ''}${adjustment.delta} hari`}
                  tone={adjustment.delta > 0 ? 'success' : adjustment.delta < 0 ? 'warning' : 'neutral'}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon={SlidersHorizontal}
              title="Belum ada penyesuaian"
              description="Saldo cuti masih memakai kuota awal role Anda."
            />
          )}
        </Card>

        <Button
          label="Ajukan cuti"
          icon={CalendarDays}
          onPress={() => navigation.navigate('SubmissionCreate')}
          style={{ marginTop: spacing.md }}
        />
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={Info}
          tone="neutral"
          body="Hanya Admin/HRD yang dapat menyesuaikan saldo cuti. Hubungi HRD bila terdapat ketidaksesuaian data."
        />
      </Screen>
    );
  }

  const lowCount = rows.filter((row) => row.remaining <= 3).length;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Kuota cuti"
          subtitle={`${rows.length} karyawan aktif · tahun ${new Date().getFullYear()}`}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>TOTAL SISA KUOTA PERUSAHAAN</AppText>
            <AppText style={styles.heroValue}>{totals.remaining} hari</AppText>
            <AppText style={styles.heroHint}>
              {totals.used} hari terpakai dari {totals.quota} hari kuota
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <CalendarCheck size={22} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Kuota total"
          value={`${totals.quota} hari`}
          icon={CalendarDays}
          tone="info"
          hint={`${rows.length} karyawan`}
        />
        <StatCard
          label="Sisa kritis"
          value={`${lowCount} orang`}
          icon={SlidersHorizontal}
          tone={lowCount > 0 ? 'warning' : 'success'}
          hint="Sisa ≤ 3 hari"
        />
      </View>

      <SectionHeader title="Cari & filter" subtitle="Urut dari sisa cuti terkecil" />
      <SearchField value={search} onChangeText={setSearch} placeholder="Cari nama atau kode karyawan" />
      <FilterChips
        style={{ marginTop: spacing.sm }}
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={[
          { value: 'ALL', label: 'Semua', count: rows.length },
          { value: 'LOW', label: 'Sisa kritis', count: lowCount },
          { value: 'NORMAL', label: 'Aman', count: rows.length - lowCount },
        ]}
      />

      <View style={styles.list}>
        {filtered.map(({ employee, balance, remaining, role }) => {
          const usagePercent = balance?.totalQuota
            ? Math.round(((balance.totalQuota - remaining) / balance.totalQuota) * 100)
            : 0;
          return (
            <Pressable
              key={employee.id}
              onPress={() => navigation.navigate('LeaveAllocationDetail', { userId: employee.id })}
              accessibilityRole="button"
              accessibilityLabel={`Atur kuota cuti ${employee.name}`}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Avatar name={employee.name} size={42} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.rowTitle}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {employee.name}
                  </AppText>
                  <AppText variant="smallStrong" color={remaining <= 3 ? colors.warningDark : colors.accentDark}>
                    {remaining} hari
                  </AppText>
                </View>
                <AppText variant="caption" numberOfLines={1}>
                  {role?.name ?? 'Karyawan'} · {employee.employeeCode}
                </AppText>
                <ProgressBar
                  value={usagePercent}
                  tone={remaining <= 3 ? 'warning' : 'accent'}
                  height={5}
                />
                <AppText variant="caption">
                  Terpakai {balance?.used ?? 0} dari {balance?.totalQuota ?? 0} hari
                  {balance && balance.adjustments.length > 0
                    ? ` · ${balance.adjustments.length} penyesuaian`
                    : ''}
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada karyawan"
          description="Ubah kata kunci atau filter untuk melihat data lain."
        />
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        title="Kuota cuti tahunan"
        body="Saldo dipotong otomatis satu kali setelah HRD dan Owner menyetujui pengajuan cuti tahunan. Penyesuaian manual akan tercatat pada riwayat karyawan."
      />
      <InfoNote
        style={{ marginTop: spacing.sm }}
        icon={Users}
        tone="neutral"
        body={`${activeEmployees.length} karyawan aktif mengikuti kuota role masing-masing. Karyawan nonaktif tidak ditampilkan.`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  policyCard: { gap: spacing.md },
  policyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  adjustBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
