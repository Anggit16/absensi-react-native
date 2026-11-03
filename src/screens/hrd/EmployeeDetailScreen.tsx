import { RouteProp, useRoute } from '@react-navigation/native';
import {
  Briefcase,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  ScanFace,
  ShieldCheck,
  UserCog,
  Wallet,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { AccountStatusBadge, Badge, RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { useToast } from '../../components/common/Toast';
import { AttendanceRow } from '../../components/attendance/AttendanceRow';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { formatDate, todayISO } from '../../utils/date';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function EmployeeDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'EmployeeDetail'>>();
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { showToast } = useToast();
  const { getUser, getRoleForUser, getLocationForUser, getBalance, attendances, submissions, setUserStatus, deleteUser } =
    useApp();

  const [confirmStatus, setConfirmStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const employee = getUser(route.params.userId);
  const role = getRoleForUser(employee);
  const location = getLocationForUser(employee);
  const balance = getBalance(employee?.id);

  const canManage = user.role === 'HRD';

  const recentAttendance = attendances
    .filter((record) => record.userId === employee?.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const mySubmissions = submissions
    .filter((submission) => submission.userId === employee?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const remaining = balance ? balance.totalQuota - balance.used : 0;
  const usagePercent = balance?.totalQuota
    ? Math.round(((balance.totalQuota - remaining) / balance.totalQuota) * 100)
    : 0;

  if (!employee) {
    return (
      <Screen header={<ScreenHeader title="Detail karyawan" onBack={() => navigation.goBack()} />}>
        <EmptyState
          icon={UserCog}
          title="Karyawan tidak ditemukan"
          description="Data mungkin sudah dihapus di server."
        />
      </Screen>
    );
  }

  const nextStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return (
    <Screen
      header={
        <ScreenHeader
          title={employee.name}
          subtitle={`${employee.employeeCode} · ${role?.name ?? 'Karyawan'}`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        canManage ? (
          <View style={styles.footer}>
            <Button
              label="Edit data karyawan"
              icon={UserCog}
              onPress={() => navigation.navigate('EmployeeForm', { userId: employee.id })}
            />
            <Button
              label={employee.status === 'ACTIVE' ? 'Nonaktifkan akun' : 'Aktifkan akun'}
              variant="outline"
              onPress={() => setConfirmStatus(true)}
            />
          </View>
        ) : undefined
      }
    >
      <Card style={styles.profileCard}>
        <Avatar name={employee.name} size={68} />
        <View style={styles.profileText}>
          <AppText variant="title" align="center">
            {employee.name}
          </AppText>
          <View style={styles.badgeRow}>
            <RoleBadge role={employee.role} />
            <AccountStatusBadge status={employee.status} />
          </View>
          <AppText variant="caption" align="center">
            {role?.department ?? 'Tanpa departemen'} · bergabung {formatDate(employee.joinDate)}
          </AppText>
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="subtitle">Informasi karyawan</AppText>
        <Divider />
        <DetailRow label="Email" value={employee.email} icon={Mail} />
        <DetailRow label="Telepon" value={employee.phone} icon={Phone} />
        <DetailRow label="Username" value={employee.username} />
        <DetailRow label="Kode karyawan" value={employee.employeeCode} />
        <DetailRow label="Status kepegawaian" value={EMPLOYMENT_TYPE_LABEL[employee.employmentType]} />
        <DetailRow
          label="Role kerja"
          value={role ? `${role.name} (${role.department})` : 'Belum diatur'}
          icon={Briefcase}
        />
        <DetailRow label="Lokasi kerja" value={location?.name ?? 'Belum diatur'} icon={MapPin} />
        <DetailRow label="Tanggal lahir" value={employee.birthDate ? formatDate(employee.birthDate) : '-'} />
        <Divider />
        <View style={styles.addressBlock}>
          <AppText variant="caption">Alamat</AppText>
          <AppText variant="small" style={{ marginTop: 2 }}>
            {employee.address ?? 'Belum diisi'}
          </AppText>
        </View>
        {employee.emergencyContact ? (
          <View style={styles.addressBlock}>
            <AppText variant="caption">Kontak darurat</AppText>
            <AppText variant="small" style={{ marginTop: 2 }}>
              {employee.emergencyContact}
            </AppText>
          </View>
        ) : null}
        {employee.notes ? (
          <InfoNote icon={ShieldCheck} tone="neutral" body={employee.notes} />
        ) : null}
      </Card>

      <SectionHeader title="Jam kerja & kompensasi" subtitle="Mengikuti role kerja" />
      <Card style={styles.section}>
        <DetailRow label="Jam masuk" value={role?.checkInTime ?? '—'} />
        <DetailRow label="Jam pulang" value={role?.checkOutTime ?? '—'} />
        <DetailRow label="Toleransi telat" value={`${role?.lateToleranceMinutes ?? 0} menit`} />
        <DetailRow label="Kuota cuti tahunan" value={`${role?.annualLeaveQuota ?? 0} hari`} />
        <Divider />
        <Button
          label="Buka rincian payroll"
          variant="secondary"
          size="sm"
          icon={Wallet}
          onPress={() =>
            navigation.navigate('PayrollDetail', {
              userId: employee.id,
              period: todayISO().slice(0, 7),
            })
          }
        />
      </Card>

      {balance ? (
        <>
          <SectionHeader
            title="Kuota cuti"
            subtitle={`Tahun ${balance.year}`}
            actionLabel="Kelola"
            onAction={() => navigation.navigate('LeaveAllocationDetail', { userId: employee.id })}
          />
          <Card style={styles.section}>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="numberLg" color={remaining <= 3 ? colors.warningDark : colors.accentDark}>
                  {remaining} hari
                </AppText>
                <AppText variant="caption">
                  Sisa dari {balance.totalQuota} hari · terpakai {balance.used} hari
                </AppText>
              </View>
              <Badge label={`${usagePercent}%`} tone={usagePercent > 75 ? 'warning' : 'success'} />
            </View>
            <ProgressBar
              value={usagePercent}
              tone={usagePercent > 75 ? 'warning' : 'accent'}
              style={{ marginTop: spacing.md }}
            />
            {balance.adjustments.length > 0 ? (
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                <AppText variant="caption">PENYESUAIAN TERAKHIR</AppText>
                {balance.adjustments.slice(0, 2).map((adjustment) => (
                  <AppText key={adjustment.id} variant="caption" numberOfLines={1}>
                    {adjustment.delta > 0 ? '+' : ''}
                    {adjustment.delta} hari · {adjustment.reason}
                  </AppText>
                ))}
              </View>
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="Absensi terakhir"
        subtitle={`${recentAttendance.length} catatan terbaru`}
        actionLabel="Semua"
        onAction={() => navigation.navigate('AttendanceMonitoring')}
      />
      {recentAttendance.length === 0 ? (
        <EmptyState
          icon={ScanFace}
          title="Belum ada absensi"
          description="Karyawan ini belum memiliki catatan kehadiran di server."
        />
      ) : (
        <View style={styles.list}>
          {recentAttendance.map((record) => (
            <AttendanceRow key={record.id} record={record} user={employee} showDate />
          ))}
        </View>
      )}

      <SectionHeader
        title="Pengajuan"
        subtitle={`${mySubmissions.length} pengajuan tercatat`}
        actionLabel="Kelola"
        onAction={() => navigation.navigate('Approvals')}
      />
      {mySubmissions.slice(0, 3).map((submission) => (
        <View key={submission.id} style={{ marginBottom: spacing.sm }}>
          <SubmissionCard
            submission={submission}
            onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
          />
        </View>
      ))}
      {mySubmissions.length === 0 ? (
        <Card style={styles.section}>
          <View style={styles.rowBetween}>
            <ClipboardList size={18} color={colors.textMuted} strokeWidth={2} />
            <AppText variant="small" style={{ flex: 1, marginLeft: spacing.sm }}>
              Belum ada pengajuan cuti, izin, sakit, atau resign.
            </AppText>
          </View>
        </Card>
      ) : null}

      {canManage ? (
        <>
          <SectionHeader title="Zona berbahaya" subtitle="Tindakan tidak dapat dibatalkan" />
          <Card tone="danger" style={styles.section}>
            <AppText variant="bodyStrong" color={colors.dangerDark}>
              Hapus data karyawan
            </AppText>
            <AppText variant="caption" color={colors.dangerDark} style={{ lineHeight: 16 }}>
              Menghapus karyawan juga menghapus saldo cuti dan komponen gajinya di server.
              Riwayat absensi historis tetap tersimpan tanpa profil.
            </AppText>
            <Button
              label="Hapus karyawan"
              variant="danger"
              size="sm"
              onPress={() => setConfirmDelete(true)}
            />
          </Card>
        </>
      ) : (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={InfoIcon}
          tone="neutral"
          body="Owner dapat melihat data karyawan, namun perubahan data hanya dapat dilakukan Admin/HRD."
        />
      )}

      <ConfirmDialog
        visible={confirmStatus}
        title={nextStatus === 'INACTIVE' ? 'Nonaktifkan akun?' : 'Aktifkan akun?'}
        message={
          nextStatus === 'INACTIVE'
            ? 'Karyawan tidak dapat login dan tidak masuk rekap payroll aktif. Riwayat tetap tersimpan.'
            : 'Karyawan akan dapat login kembali dan muncul pada rekap payroll aktif.'
        }
        confirmLabel={nextStatus === 'INACTIVE' ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        tone={nextStatus === 'INACTIVE' ? 'danger' : 'success'}
        onConfirm={async () => {
          const result = await setUserStatus(employee.id, nextStatus);
          setConfirmStatus(false);
          showToast(result.message, result.ok ? 'success' : 'error');
        }}
        onCancel={() => setConfirmStatus(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus karyawan?"
        message={`${employee.name} akan dihapus dari server beserta saldo cutinya. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        onConfirm={async () => {
          const result = await deleteUser(employee.id);
          setConfirmDelete(false);
          if (result.ok) {
            showToast(result.message, 'success');
            navigation.goBack();
          } else {
            showToast(result.message, 'error');
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}

const InfoIcon = ShieldCheck;

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
  profileCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  profileText: { alignItems: 'center', gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  section: { marginTop: spacing.md, gap: spacing.sm },
  addressBlock: { paddingVertical: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  list: { gap: spacing.sm },
});
