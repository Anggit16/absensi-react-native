import {
  Briefcase,
  CalendarCheck,
  ChevronRight,
  Info,
  MapPin,
  ScanFace,
  Settings,
  User,
  UserCog,
  Users,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { ROLE_LABEL } from '../../constants';
import { useAppNavigation } from '../../navigation/types';

interface MenuItem {
  label: string;
  description: string;
  icon: typeof Users;
  onPress: () => void;
  badge?: string;
}

export function MenuScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { submissions, users, roles, locations } = useApp();

  const pendingCount = submissions.filter((submission) =>
    user.role === 'HRD' ? submission.status === 'PENDING_HRD' : submission.status === 'PENDING_OWNER',
  ).length;

  const groups: { title: string; caption?: string; items: MenuItem[] }[] =
    user.role === 'OWNER'
      ? [
          {
            title: 'Manajemen SDM',
            items: [
              {
                label: 'Manajemen HRD',
                description: 'Akun Admin/HRD & komponen gaji',
                icon: UserCog,
                onPress: () => navigation.navigate('HrdList'),
              },
              {
                label: 'Monitoring Absensi',
                description: `${users.length} karyawan terdaftar`,
                icon: ScanFace,
                onPress: () => navigation.navigate('AttendanceMonitoring'),
              },
              {
                label: 'Kuota Cuti',
                description: 'Ringkasan & penyesuaian saldo cuti',
                icon: CalendarCheck,
                onPress: () => navigation.navigate('LeaveAllocation'),
              },
            ],
          },
          {
            title: 'Persetujuan',
            items: [
              {
                label: 'Persetujuan Final',
                description: 'Pengajuan yang lolos verifikasi HRD',
                icon: CalendarCheck,
                onPress: () => navigation.navigate('Main'),
                badge: pendingCount > 0 ? `${pendingCount} baru` : undefined,
              },
            ],
          },
          {
            title: 'Perusahaan',
            items: [
              {
                label: 'Pengaturan Perusahaan',
                description: `${roles.length} role aktif · ${locations.length} lokasi`,
                icon: Settings,
                onPress: () => navigation.navigate('CompanySettings'),
              },
              {
                label: 'Profil Saya',
                description: ROLE_LABEL[user.role],
                icon: User,
                onPress: () => navigation.navigate('EditProfile'),
              },
            ],
          },
        ]
      : [
          {
            title: 'Master Data',
            items: [
              {
                label: 'Data Karyawan',
                description: 'Tambah, ubah, dan nonaktifkan karyawan',
                icon: Users,
                onPress: () => navigation.navigate('EmployeeList'),
              },
              {
                label: 'Role & Jam Kerja',
                description: `${roles.length} role dengan skema gaji`,
                icon: Briefcase,
                onPress: () => navigation.navigate('RoleList'),
              },
              {
                label: 'Lokasi Kerja',
                description: `${locations.length} titik lokasi geofencing`,
                icon: MapPin,
                onPress: () => navigation.navigate('LocationList'),
              },
            ],
          },
          {
            title: 'Operasional',
            items: [
              {
                label: 'Kuota Cuti',
                description: 'Alokasi & penyesuaian saldo cuti',
                icon: CalendarCheck,
                onPress: () => navigation.navigate('LeaveAllocation'),
              },
              {
                label: 'Monitoring Absensi',
                description: 'Pantau kehadiran seluruh karyawan',
                icon: ScanFace,
                onPress: () => navigation.navigate('AttendanceMonitoring'),
              },
            ],
          },
          {
            title: 'Akun',
            items: [
              {
                label: 'Profil Saya',
                description: ROLE_LABEL[user.role],
                icon: User,
                onPress: () => navigation.navigate('EditProfile'),
              },
            ],
          },
        ];

  return (
    <Screen scroll header={<ScreenHeader title="Menu Modul" subtitle={ROLE_LABEL[user.role]} onBack={() => navigation.goBack()} />}>
      <InfoNote
        icon={Info}
        tone="neutral"
        body="Seluruh modul memakai data server yang sama. Perubahan langsung terlihat di dashboard, monitoring, dan payroll."
      />

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <AppText variant="caption" style={styles.groupTitle}>
            {group.title.toUpperCase()}
          </AppText>
          <Card padded={false}>
            {group.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.row,
                    index < group.items.length - 1 && styles.rowBorder,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <Icon size={18} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong">{item.label}</AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {item.description}
                    </AppText>
                  </View>
                  {item.badge ? <Badge label={item.badge} tone="warning" /> : null}
                  <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: spacing.lg, gap: spacing.sm },
  groupTitle: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
});
