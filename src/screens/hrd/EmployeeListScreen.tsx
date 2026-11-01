import {
  Briefcase,
  ChevronRight,
  Info,
  MapPin,
  Search,
  UserPlus,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { AccountStatusBadge, Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { FilterChips } from '../../components/common/SegmentedTabs';
import { SectionHeader } from '../../components/common/Section';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { useAppNavigation } from '../../navigation/types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function EmployeeListScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, roles, getRoleForUser, getLocationForUser, getBalance, company } = useApp();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [roleId, setRoleId] = useState('ALL');

  const canManage = user.role === 'HRD' || user.role === 'OWNER';

  const employees = useMemo(
    () =>
      users
        .filter((item) => item.role === 'EMPLOYEE')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const counts = useMemo(
    () => ({
      ALL: employees.length,
      ACTIVE: employees.filter((item) => item.status === 'ACTIVE').length,
      INACTIVE: employees.filter((item) => item.status === 'INACTIVE').length,
    }),
    [employees],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (status !== 'ALL' && employee.status !== status) return false;
      if (roleId !== 'ALL' && employee.jobRoleId !== roleId) return false;
      if (!term) return true;
      return (
        employee.name.toLowerCase().includes(term) ||
        employee.employeeCode.toLowerCase().includes(term) ||
        employee.email.toLowerCase().includes(term)
      );
    });
  }, [employees, roleId, search, status]);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Data karyawan"
          subtitle={`${counts.ACTIVE} aktif · ${counts.INACTIVE} nonaktif`}
          onBack={() => navigation.goBack()}
          right={
            user.role === 'HRD' ? (
              <Button
                label="Tambah"
                size="sm"
                icon={UserPlus}
                fullWidth={false}
                onPress={() => navigation.navigate('EmployeeForm')}
              />
            ) : undefined
          }
        />
      }
      footer={
        user.role === 'HRD' ? (
          <Button
            label="Tambah karyawan baru"
            icon={UserPlus}
            onPress={() => navigation.navigate('EmployeeForm')}
          />
        ) : undefined
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>{company.name}</AppText>
            <AppText style={styles.heroValue}>{employees.length} karyawan</AppText>
            <AppText style={styles.heroHint}>
              {roles.length} role · {counts.ACTIVE} akun aktif
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <Users size={22} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
      </Card>

      <SectionHeader title="Cari & filter" subtitle="Berdasarkan status atau role kerja" />
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Cari nama, kode, atau email"
      />
      <FilterChips
        style={{ marginTop: spacing.sm }}
        value={status}
        onChange={(value) => setStatus(value as StatusFilter)}
        options={[
          { value: 'ALL', label: 'Semua', count: counts.ALL },
          { value: 'ACTIVE', label: 'Aktif', count: counts.ACTIVE },
          { value: 'INACTIVE', label: 'Nonaktif', count: counts.INACTIVE },
        ]}
      />
      <FilterChips
        style={{ marginTop: spacing.xs }}
        value={roleId}
        onChange={setRoleId}
        options={[
          { value: 'ALL', label: 'Semua role' },
          ...roles.map((role) => ({ value: role.id, label: role.name })),
        ]}
      />

      <View style={styles.list}>
        {filtered.map((employee) => {
          const role = getRoleForUser(employee);
          const location = getLocationForUser(employee);
          const balance = getBalance(employee.id);
          const remaining = balance ? balance.totalQuota - balance.used : 0;
          return (
            <Pressable
              key={employee.id}
              onPress={() => navigation.navigate('EmployeeDetail', { userId: employee.id })}
              accessibilityRole="button"
              accessibilityLabel={`Buka data ${employee.name}`}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Avatar name={employee.name} size={44} />
              <View style={styles.rowText}>
                <View style={styles.rowTitle}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {employee.name}
                  </AppText>
                  <AccountStatusBadge status={employee.status} />
                </View>
                <AppText variant="caption" numberOfLines={1}>
                  {employee.employeeCode} · {EMPLOYMENT_TYPE_LABEL[employee.employmentType]}
                </AppText>
                <View style={styles.metaRow}>
                  <Briefcase size={11} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                    {role?.name ?? 'Role belum diatur'}
                  </AppText>
                  <MapPin size={11} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption" numberOfLines={1}>
                    {location?.name ?? '—'}
                  </AppText>
                </View>
                <View style={styles.rowFooter}>
                  <Badge label={`Sisa cuti ${remaining} hari`} tone={remaining <= 3 ? 'warning' : 'neutral'} />
                  {employee.isDemoAccount ? <Badge label="Akun demo" tone="violet" /> : null}
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Karyawan tidak ditemukan"
          description="Ubah kata kunci atau filter status/role untuk melihat karyawan lain."
          actionLabel={user.role === 'HRD' ? 'Tambah karyawan' : undefined}
          onAction={user.role === 'HRD' ? () => navigation.navigate('EmployeeForm') : undefined}
        />
      ) : null}

      {!canManage ? (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={Info}
          tone="neutral"
          body="Hanya Admin/HRD yang dapat menambah atau mengubah data karyawan."
        />
      ) : (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={Info}
          tone="neutral"
          body="Menonaktifkan akun tidak menghapus riwayat absensi, pengajuan, atau payroll. Karyawan nonaktif tidak bisa login dan tidak masuk rekap payroll aktif."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { fontSize: 10.5, letterSpacing: 0.6, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.sm, marginTop: spacing.md },
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
  rowText: { flex: 1, gap: 3 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
});
