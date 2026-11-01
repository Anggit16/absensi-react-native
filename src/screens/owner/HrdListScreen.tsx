import {
  ChevronRight,
  Coins,
  Mail,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { AccountStatusBadge, Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { useAppNavigation } from '../../navigation/types';

export function HrdListScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, getCompensation } = useApp();
  const [search, setSearch] = useState('');

  const hrdUsers = useMemo(
    () =>
      users
        .filter((item) => item.role === 'HRD')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return hrdUsers.filter((item) =>
      term
        ? item.name.toLowerCase().includes(term) ||
          item.email.toLowerCase().includes(term) ||
          item.employeeCode.toLowerCase().includes(term)
        : true,
    );
  }, [hrdUsers, search]);

  const totalPayroll = hrdUsers.reduce((total, item) => {
    const compensation = getCompensation(item.id);
    if (!compensation || item.status !== 'ACTIVE') return total;
    return (
      total +
      compensation.baseSalary +
      compensation.positionAllowance +
      compensation.transportAllowance +
      compensation.mealAllowance -
      compensation.bpjsDeduction
    );
  }, 0);

  if (user.role !== 'OWNER') {
    return (
      <Screen header={<ScreenHeader title="Manajemen HRD" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Manajemen akun Admin/HRD dan komponen gajinya merupakan kewenangan Owner."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Manajemen HRD"
          subtitle={`${hrdUsers.filter((item) => item.status === 'ACTIVE').length} akun aktif`}
          onBack={() => navigation.goBack()}
          right={
            <Button
              label="Tambah"
              size="sm"
              icon={UserPlus}
              fullWidth={false}
              onPress={() => navigation.navigate('HrdForm')}
            />
          }
        />
      }
      footer={<Button label="Tambah akun HRD" icon={UserPlus} onPress={() => navigation.navigate('HrdForm')} />}
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>TIM ADMIN / HRD</AppText>
            <AppText style={styles.heroValue}>{hrdUsers.length} akun</AppText>
            <AppText style={styles.heroHint}>
              Verifikasi tahap pertama pengajuan & pengelolaan data karyawan
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <UserCog size={22} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Akun aktif"
          value={String(hrdUsers.filter((item) => item.status === 'ACTIVE').length)}
          icon={ShieldCheck}
          tone="success"
          hint={`${hrdUsers.filter((item) => item.status === 'INACTIVE').length} nonaktif`}
        />
        <StatCard
          label="Payroll HRD / bulan"
          value={formatCurrency(totalPayroll)}
          icon={Coins}
          tone="primary"
          hint="Gaji bulanan tetap"
        />
      </View>

      <SectionHeader title="Daftar akun HRD" subtitle="Ketuk untuk melihat detail & kompensasi" />
      <SearchField value={search} onChangeText={setSearch} placeholder="Cari nama, email, atau kode" />

      <View style={styles.list}>
        {filtered.map((hrd) => {
          const compensation = getCompensation(hrd.id);
          const gross = compensation
            ? compensation.baseSalary +
              compensation.positionAllowance +
              compensation.transportAllowance +
              compensation.mealAllowance -
              compensation.bpjsDeduction
            : 0;
          return (
            <Pressable
              key={hrd.id}
              onPress={() => navigation.navigate('HrdDetail', { userId: hrd.id })}
              accessibilityRole="button"
              accessibilityLabel={`Buka akun HRD ${hrd.name}`}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Avatar name={hrd.name} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.rowTitle}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {hrd.name}
                  </AppText>
                  <AccountStatusBadge status={hrd.status} />
                </View>
                <View style={styles.metaRow}>
                  <Mail size={11} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption" numberOfLines={1}>
                    {hrd.email}
                  </AppText>
                </View>
                <AppText variant="caption">
                  {hrd.employeeCode} · {EMPLOYMENT_TYPE_LABEL[hrd.employmentType]}
                  {hrd.isDemoAccount ? ' · akun demo' : ''}
                </AppText>
                <View style={styles.footerRow}>
                  <Badge
                    label={compensation ? formatCurrency(gross) : 'Belum ada komponen gaji'}
                    tone={compensation ? 'success' : 'warning'}
                  />
                  {!compensation ? <Badge label="Perlu dilengkapi" tone="warning" /> : null}
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Akun HRD tidak ditemukan"
          description="Ubah kata kunci atau tambahkan akun Admin/HRD baru."
          actionLabel="Tambah akun HRD"
          onAction={() => navigation.navigate('HrdForm')}
        />
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ShieldCheck}
        tone="neutral"
        title="Kewenangan Owner"
        body="Owner dapat membuat akun HRD, mengatur komponen gaji bulanan, menonaktifkan akses, dan menghapus akun non-demo. HRD tidak dapat mengelola akun HRD lain."
      />
    </Screen>
  );
}

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
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 3 },
});
