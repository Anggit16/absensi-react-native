import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { AccountStatusBadge, RoleBadge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote, ProgressBar } from '../../components/common/Feedback';
import { IconButton, ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { Divider, SectionHeader } from '../../components/common/Section';
import { useToast } from '../../components/common/Toast';
import { DEMO_ACCOUNTS, EMPLOYMENT_TYPE_LABEL, ROLE_LABEL } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDate, todayISO } from '../../utils/date';
import { useAppNavigation } from '../../navigation/types';

export function ProfileScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { showToast } = useToast();
  const { company, getRoleForUser, getLocationForUser, getBalance, logout, switchDemoAccount, resetDemoData, submissions, users } =
    useApp();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const role = getRoleForUser(user);
  const location = getLocationForUser(user);
  const balance = getBalance(user.id);
  const remaining = balance ? balance.totalQuota - balance.used : 0;
  const mySubmissions = submissions.filter((submission) => submission.userId === user.id);

  const menuItems =
    user.role === 'EMPLOYEE'
      ? [
          {
            label: 'Riwayat Absensi',
            description: 'Filter tanggal dan status kehadiran',
            icon: ScanFace,
            onPress: () => navigation.navigate('AttendanceHistory'),
          },
          {
            label: 'Pengajuan Saya',
            description: `${mySubmissions.length} pengajuan tercatat`,
            icon: ClipboardList,
            onPress: () => navigation.navigate('Submissions'),
          },
          {
            label: 'Kuota Cuti',
            description: `Sisa ${remaining} dari ${balance?.totalQuota ?? 0} hari`,
            icon: CalendarCheck,
            onPress: () => navigation.navigate('LeaveAllocation'),
          },
        ]
      : user.role === 'HRD'
        ? [
            {
              label: 'Data Karyawan',
              description: `${users.filter((item) => item.role === 'EMPLOYEE').length} karyawan terdaftar`,
              icon: Users,
              onPress: () => navigation.navigate('EmployeeList'),
            },
            {
              label: 'Monitoring Absensi',
              description: 'Pantau kehadiran hari ini',
              icon: ScanFace,
              onPress: () => navigation.navigate('AttendanceMonitoring'),
            },
            {
              label: 'Kuota Cuti',
              description: 'Alokasi cuti tahunan karyawan',
              icon: CalendarCheck,
              onPress: () => navigation.navigate('LeaveAllocation'),
            },
          ]
        : [
            {
              label: 'Manajemen HRD',
              description: 'Akun HRD dan komponen gaji',
              icon: UserCog,
              onPress: () => navigation.navigate('HrdList'),
            },
            {
              label: 'Monitoring Absensi',
              description: 'Kehadiran seluruh karyawan',
              icon: ScanFace,
              onPress: () => navigation.navigate('AttendanceMonitoring'),
            },
            {
              label: 'Kuota Cuti',
              description: 'Ringkasan sisa cuti perusahaan',
              icon: CalendarCheck,
              onPress: () => navigation.navigate('LeaveAllocation'),
            },
          ];

  const handleSwitch = (roleKey: 'owner' | 'hrd' | 'employee') => {
    const result = switchDemoAccount(roleKey);
    if (result.ok) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      showToast(result.message, 'success', 'Akun demo diganti');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Profil"
          subtitle={company.name}
          onMenu={user.role === 'EMPLOYEE' ? undefined : () => navigation.navigate('Menu')}
          right={
            <IconButton
              icon={Pencil}
              accessibilityLabel="Edit profil"
              onPress={() => navigation.navigate('EditProfile')}
              backgroundColor={colors.surface}
              color={colors.primary}
              style={styles.bordered}
            />
          }
        />
      }
    >
      <Card style={styles.identityCard}>
        <Avatar name={user.name} size={72} />
        <View style={styles.identityText}>
          <AppText variant="title" align="center">
            {user.name}
          </AppText>
          <View style={styles.badgeRow}>
            <RoleBadge role={user.role} size="md" />
            <AccountStatusBadge status={user.status} />
          </View>
          <AppText variant="small" align="center">
            {role?.name ?? ROLE_LABEL[user.role]} · {user.employeeCode}
          </AppText>
        </View>
      </Card>

      <Card>
        <AppText variant="subtitle">Informasi akun</AppText>
        <Divider />
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={Phone} label="Telepon" value={user.phone} />
        <InfoRow icon={MapPin} label="Lokasi kerja" value={location?.name ?? 'Belum ditetapkan'} />
        <InfoRow
          icon={ShieldCheck}
          label="Status kepegawaian"
          value={`${EMPLOYMENT_TYPE_LABEL[user.employmentType]} · bergabung ${formatDate(user.joinDate)}`}
        />
      </Card>

      {user.role === 'EMPLOYEE' && balance ? (
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <AppText variant="subtitle">Kuota cuti {balance.year}</AppText>
              <AppText variant="caption">Tahun berjalan · data demo</AppText>
            </View>
            <AppText variant="numberLg" color={colors.accentDark}>
              {remaining}
              <AppText variant="caption"> / {balance.totalQuota} hari</AppText>
            </AppText>
          </View>
          <ProgressBar
            value={balance.totalQuota ? (remaining / balance.totalQuota) * 100 : 0}
            style={{ marginTop: spacing.md }}
          />
          <View style={styles.rowBetween}>
            <AppText variant="caption">Terpakai {balance.used} hari</AppText>
            <AppText variant="caption">Sisa {remaining} hari</AppText>
          </View>
        </Card>
      ) : null}

      <View style={styles.menuGroup}>
        <AppText variant="caption" style={styles.groupTitle}>
          MENU CEPAT
        </AppText>
        <Card padded={false}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.menuRow,
                  index < menuItems.length - 1 && styles.menuRowBorder,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.menuIcon}>
                  <Icon size={17} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.menuText}>
                  <AppText variant="bodyStrong">{item.label}</AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {item.description}
                  </AppText>
                </View>
                <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            );
          })}
        </Card>
      </View>

      <SectionHeader title="Akun demo" subtitle="Uji seluruh role tanpa menghapus data project." />
      <Card style={styles.demoCard}>
        <InfoNote
          icon={ShieldCheck}
          tone="neutral"
          body="Perpindahan akun hanya mengganti sesi, bukan menghapus data. Seluruh perubahan mock tetap tersimpan selama aplikasi berjalan."
        />
        {DEMO_ACCOUNTS.map((account) => {
          const active = account.role === user.role;
          return (
            <Pressable
              key={account.key}
              onPress={() => handleSwitch(account.key)}
              disabled={active}
              accessibilityRole="button"
              accessibilityLabel={`Ganti ke akun ${account.label}`}
              style={({ pressed }) => [
                styles.demoRow,
                active && styles.demoRowActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.demoText}>
                <AppText variant="bodyStrong">{account.label}</AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {account.email}
                </AppText>
              </View>
              {active ? (
                <AppText style={styles.activeLabel}>Sedang aktif</AppText>
              ) : (
                <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
              )}
            </Pressable>
          );
        })}
        <Button
          label="Reset data demo"
          variant="secondary"
          size="sm"
          icon={RotateCcw}
          onPress={() => setConfirmReset(true)}
        />
        <Button
          label="Keluar dari akun"
          variant="outline"
          icon={LogOut}
          onPress={() => setConfirmLogout(true)}
          style={{ borderColor: colors.dangerSoft }}
        />
        <AppText variant="caption" align="center">
          AbsensiPro v1.0 · frontend demo · {todayISO()} · tanpa backend
        </AppText>
      </Card>

      <ConfirmDialog
        visible={confirmLogout}
        title="Keluar dari akun?"
        message="Anda akan kembali ke halaman login. Data mock pada sesi ini tetap tersimpan sampai aplikasi ditutup."
        confirmLabel="Ya, keluar"
        tone="danger"
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
      <ConfirmDialog
        visible={confirmReset}
        title="Reset data demo?"
        message="Seluruh perubahan yang Anda buat (karyawan, absensi, pengajuan, payroll) akan dikembalikan ke data awal."
        confirmLabel="Reset sekarang"
        tone="warning"
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          showToast('Data demo dikembalikan ke kondisi awal.', 'success');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon size={15} color={colors.textMuted} strokeWidth={2} />
      <AppText variant="small" style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText variant="small" style={styles.infoValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bordered: { borderWidth: 1, borderColor: colors.border },
  identityCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  identityText: { alignItems: 'center', gap: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 7 },
  infoLabel: { width: 120, color: colors.textMuted },
  infoValue: { flex: 1, textAlign: 'right', color: colors.text },
  menuGroup: { marginTop: spacing.lg, gap: spacing.sm },
  groupTitle: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.7 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 1 },
  demoCard: { gap: spacing.sm },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  demoRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSubtle },
  demoText: { flex: 1, gap: 1 },
  activeLabel: { fontSize: 11, fontWeight: '700', color: colors.accentDark },
});
