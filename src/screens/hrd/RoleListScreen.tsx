import {
  Briefcase,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { SectionHeader } from '../../components/common/Section';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { SALARY_BASIS_LABEL } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { useAppNavigation } from '../../navigation/types';

export function RoleListScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { roles, users, getLocation } = useApp();
  const [search, setSearch] = useState('');

  const canManage = user.role === 'HRD';

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roles.filter((role) =>
      term
        ? role.name.toLowerCase().includes(term) ||
          role.department.toLowerCase().includes(term)
        : true,
    );
  }, [roles, search]);

  const employeeCount = (roleId: string) =>
    users.filter((item) => item.jobRoleId === roleId && item.role === 'EMPLOYEE').length;

  if (user.role === 'EMPLOYEE') {
    return (
      <Screen header={<ScreenHeader title="Role & jam kerja" onBack={() => navigation.goBack()} />}>
        <AccessDenied description="Master role kerja hanya dapat diakses Owner dan Admin/HRD." />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Role & jam kerja"
          subtitle={`${roles.length} role · ${roles.filter((role) => role.status === 'ACTIVE').length} aktif`}
          onBack={() => navigation.goBack()}
          right={
            canManage ? (
              <Button
                label="Tambah"
                size="sm"
                icon={Plus}
                fullWidth={false}
                onPress={() => navigation.navigate('RoleForm')}
              />
            ) : undefined
          }
        />
      }
      footer={
        canManage ? (
          <Button label="Tambah role baru" icon={Plus} onPress={() => navigation.navigate('RoleForm')} />
        ) : undefined
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>MASTER ROLE</AppText>
            <AppText style={styles.heroValue}>{roles.length} role kerja</AppText>
            <AppText style={styles.heroHint}>
              Jam kerja, toleransi, dan skema gaji per role
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <Briefcase size={22} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
      </Card>

      <SectionHeader title="Daftar role" subtitle="Ketuk untuk mengubah pengaturan" />
      <SearchField value={search} onChangeText={setSearch} placeholder="Cari nama role atau departemen" />

      <View style={styles.list}>
        {filtered.map((role) => {
          const location = getLocation(role.locationId);
          const count = employeeCount(role.id);
          return (
            <Pressable
              key={role.id}
              onPress={() => navigation.navigate('RoleForm', { roleId: role.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ubah role ${role.name}`}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.icon}>
                  <Briefcase size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {role.name}
                  </AppText>
                  <AppText variant="caption">{role.department}</AppText>
                </View>
                <Badge
                  label={role.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  tone={role.status === 'ACTIVE' ? 'success' : 'neutral'}
                />
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Clock3 size={12} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption">
                    {role.checkInTime}–{role.checkOutTime} · toleransi {role.lateToleranceMinutes}m
                  </AppText>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption" numberOfLines={1}>
                    {location?.name ?? 'Lokasi tidak ditemukan'}
                  </AppText>
                </View>
                <View style={styles.metaItem}>
                  <Users size={12} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption">
                    {count} karyawan · kuota {role.annualLeaveQuota} hari
                  </AppText>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption">GAJI POKOK ({SALARY_BASIS_LABEL[role.salaryBasis].toUpperCase()})</AppText>
                  <AppText variant="smallStrong">{formatCurrency(role.baseSalary)}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="caption">TUNJANGAN / HARI</AppText>
                  <AppText variant="smallStrong">
                    {formatCurrency(role.transportAllowance + role.mealAllowance)}
                  </AppText>
                </View>
                <ChevronRight size={15} color={colors.textMuted} strokeWidth={2.2} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Role tidak ditemukan"
          description="Ubah kata kunci atau tambahkan role kerja baru."
          actionLabel={canManage ? 'Tambah role' : undefined}
          onAction={canManage ? () => navigation.navigate('RoleForm') : undefined}
        />
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={InfoIcon}
        tone="neutral"
        title="Role menentukan perilaku absensi"
        body="Jam masuk, jam pulang, dan toleransi pada role dipakai untuk menghitung keterlambatan. Komponen gaji dipakai pada rekap payroll simulasi."
      />
    </Screen>
  );
}

const InfoIcon = Briefcase;

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaGrid: { gap: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
