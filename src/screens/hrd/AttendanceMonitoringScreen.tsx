import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  ScanFace,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { FilterChips } from '../../components/common/SegmentedTabs';
import { DateField } from '../../components/common/DateField';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { AttendanceRow } from '../../components/attendance/AttendanceRow';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDateLong, todayISO } from '../../utils/date';
import { summaryFromAttendance } from '../../utils/payroll';
import type { AttendanceStatus } from '../../types';
import { useAppNavigation } from '../../navigation/types';
import { ROLE_LABEL } from '../../constants';

type Filter = 'ALL' | AttendanceStatus | 'NOT_CHECKED_IN';

export function AttendanceMonitoringScreen({ showBack = false }: { showBack?: boolean }) {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, attendances, locations, getRoleForUser, getLocation } = useApp();

  const [date, setDate] = useState(todayISO());
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('ALL');

  const isToday = date === todayISO();

  const activeEmployees = users.filter(
    (item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE',
  );

  const dayRecords = useMemo(
    () => attendances.filter((record) => record.date === date),
    [attendances, date],
  );

  const summary = useMemo(() => summaryFromAttendance(dayRecords), [dayRecords]);

  const notCheckedIn = useMemo(
    () =>
      activeEmployees.filter(
        (employee) => !dayRecords.some((record) => record.userId === employee.id),
      ),
    [activeEmployees, dayRecords],
  );

  const matchesEmployee = (employeeId: string) => {
    const employee = users.find((item) => item.id === employeeId);
    if (!employee) return false;
    const term = search.trim().toLowerCase();
    const matchesSearch = term
      ? employee.name.toLowerCase().includes(term) ||
        employee.employeeCode.toLowerCase().includes(term)
      : true;
    const matchesLocation =
      locationId === 'ALL' || getLocation(getRoleForUser(employee)?.locationId)?.id === locationId || employee.locationId === locationId;
    return matchesSearch && matchesLocation;
  };

  const records = useMemo(
    () =>
      dayRecords
        .filter((record) => {
          if (filter === 'NOT_CHECKED_IN') return false;
          if (filter !== 'ALL' && record.status !== filter) return false;
          return matchesEmployee(record.userId);
        })
        .sort((a, b) => (a.checkInAt ?? '').localeCompare(b.checkInAt ?? '')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayRecords, filter, locationId, search, users],
  );

  const missing = useMemo(
    () => (filter === 'ALL' || filter === 'NOT_CHECKED_IN' ? notCheckedIn.filter((employee) => matchesEmployee(employee.id)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, locationId, notCheckedIn, search, users],
  );

  const attendanceRate = activeEmployees.length
    ? Math.round(((summary.onTime + summary.late) / activeEmployees.length) * 100)
    : 0;

  const locationOptions = [
    { value: 'ALL', label: 'Semua lokasi' },
    ...locations.map((location) => ({ value: location.id, label: location.name })),
  ];

  if (user.role === 'EMPLOYEE') {
    return (
      <Screen header={<ScreenHeader title="Monitoring absensi" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Monitoring seluruh karyawan hanya tersedia untuk Owner dan Admin/HRD. Gunakan menu Riwayat Absensi pada profil untuk melihat kehadiran pribadi."
          actionLabel="Buka riwayat pribadi"
          onAction={() => navigation.navigate('AttendanceHistory')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Monitoring absensi"
          eyebrow={isToday ? 'Live hari ini' : 'Data historis'}
          subtitle={`${formatDateLong(date)} · ${ROLE_LABEL[user.role]}`}
          onBack={showBack ? () => navigation.goBack() : undefined}
          onMenu={showBack ? undefined : () => navigation.navigate('Menu')}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>KEHADIRAN {isToday ? 'HARI INI' : 'PADA TANGGAL INI'}</AppText>
            <AppText style={styles.heroValue}>
              {summary.onTime + summary.late}
              <AppText style={styles.heroMuted}> / {activeEmployees.length} karyawan</AppText>
            </AppText>
            <AppText style={styles.heroHint}>
              {summary.late} terlambat · {summary.absent} absen · {summary.onLeave} cuti ·{' '}
              {notCheckedIn.length} belum absen
            </AppText>
          </View>
          <View style={styles.heroRing}>
            <AppText style={styles.heroRingValue}>{attendanceRate}%</AppText>
          </View>
        </View>
        <View style={styles.heroBadges}>
          <Badge label={isToday ? 'Data live mock' : 'Arsip mock'} tone="dark" />
          <Badge label={`${summary.total} catatan`} tone="dark" />
        </View>
      </Card>

      <View style={styles.statRow}>
        <StatCard
          label="Tepat waktu"
          value={String(summary.onTime)}
          icon={UserCheck}
          tone="success"
          hint="Masuk dalam toleransi"
        />
        <StatCard
          label="Terlambat"
          value={String(summary.late)}
          icon={Clock3}
          tone="warning"
          hint="Melebihi toleransi"
        />
      </View>
      <View style={[styles.statRow, { marginTop: spacing.sm }]}>
        <StatCard
          label="Belum absen"
          value={String(notCheckedIn.length)}
          icon={UserX}
          tone={notCheckedIn.length > 0 ? 'danger' : 'success'}
          hint="Tanpa catatan hari ini"
        />
        <StatCard
          label="Karyawan aktif"
          value={String(activeEmployees.length)}
          icon={Users}
          tone="info"
          hint={`${locations.length} lokasi kerja`}
        />
      </View>

      <SectionHeader title="Filter & pencarian" subtitle="Cari karyawan, status, atau lokasi" />
      <Card style={styles.filterCard}>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama atau kode karyawan"
        />
        <DateField
          label="Tanggal monitoring"
          value={date}
          onChange={setDate}
          maxDate={todayISO()}
        />
        <View style={styles.locationRow}>
          {locationOptions.map((option) => {
            const active = option.value === locationId;
            return (
              <Button
                key={option.value}
                label={option.label}
                size="sm"
                variant={active ? 'primary' : 'secondary'}
                fullWidth={false}
                onPress={() => setLocationId(option.value)}
              />
            );
          })}
        </View>
        <FilterChips
          value={filter}
          onChange={(value) => setFilter(value as Filter)}
          options={[
            { value: 'ALL', label: 'Semua', count: dayRecords.length },
            { value: 'ON_TIME', label: 'Tepat waktu', count: summary.onTime },
            { value: 'LATE', label: 'Terlambat', count: summary.late },
            { value: 'ON_LEAVE', label: 'Cuti', count: summary.onLeave },
            { value: 'ABSENT', label: 'Absen', count: summary.absent },
            { value: 'NOT_CHECKED_IN', label: 'Belum absen', count: notCheckedIn.length },
          ]}
        />
        <View style={styles.filterFooter}>
          <Button
            label="Hari ini"
            size="sm"
            variant={isToday ? 'primary' : 'outline'}
            icon={CalendarDays}
            fullWidth={false}
            onPress={() => setDate(todayISO())}
          />
          <AppText variant="caption" style={{ flex: 1, textAlign: 'right' }}>
            {records.length + missing.length} karyawan ditampilkan
          </AppText>
        </View>
      </Card>

      {missing.length > 0 ? (
        <>
          <SectionHeader
            title="Belum ada catatan absensi"
            subtitle={`${missing.length} karyawan aktif`}
          />
          <Card padded={false}>
            {missing.map((employee, index) => {
              const role = getRoleForUser(employee);
              const location = getLocation(role?.locationId);
              return (
                <View
                  key={employee.id}
                  style={[styles.missingRow, index < missing.length - 1 && styles.missingBorder]}
                >
                  <Avatar name={employee.name} size={34} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <AppText variant="smallStrong">{employee.name}</AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {role?.name ?? 'Karyawan'} · {employee.employeeCode}
                    </AppText>
                    <View style={styles.metaRow}>
                      <MapPin size={11} color={colors.textMuted} strokeWidth={2} />
                      <AppText variant="caption">{location?.name ?? 'Lokasi belum diatur'}</AppText>
                    </View>
                  </View>
                  <Badge
                    label={isToday ? 'Belum absen' : 'Tidak hadir'}
                    tone={isToday ? 'warning' : 'danger'}
                  />
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="Catatan kehadiran"
        subtitle={`${records.length} catatan sesuai filter`}
        actionLabel="Payroll"
        onAction={() => navigation.navigate('Payroll')}
      />
      <View style={styles.list}>
        {records.map((record) => {
          const employee = users.find((item) => item.id === record.userId);
          if (!employee) return null;
          return (
            <AttendanceRow
              key={record.id}
              record={record}
              user={employee}
              roleName={getRoleForUser(employee)?.name}
              onPress={() => navigation.navigate('EmployeeDetail', { userId: employee.id })}
            />
          );
        })}
      </View>

      {records.length === 0 && missing.length === 0 ? (
        <EmptyState
          icon={ScanFace}
          title="Tidak ada data"
          description="Tidak ada karyawan yang cocok dengan filter atau tanggal ini."
        />
      ) : null}

      {summary.absent > 0 ? (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={AlertTriangle}
          tone="warning"
          title={`${summary.absent} karyawan tercatat absen`}
          body="Status absen dihasilkan dari data mock. Tindak lanjut (surat peringatan, potongan) belum diotomasi pada fase frontend."
        />
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        title="Tentang monitoring"
        body="Data monitoring berasal dari absensi simulasi yang sama dengan yang dilihat karyawan. GPS, selfie, dan waktu belum diverifikasi server."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.white },
  heroMuted: { fontSize: 12.5, fontWeight: '500', color: colors.textOnDarkMuted },
  heroHint: { fontSize: 11.5, lineHeight: 17, color: colors.textOnDarkMuted },
  heroRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingValue: { fontSize: 17, fontWeight: '700', color: colors.accent },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  filterCard: { gap: spacing.md },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filterFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  missingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { gap: spacing.sm },
});
