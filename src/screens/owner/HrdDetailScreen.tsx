import { RouteProp, useRoute } from '@react-navigation/native';
import {
  Coins,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserCog,
  Wallet,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { AccountStatusBadge, Badge, RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { useToast } from '../../components/common/Toast';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { formatDate, formatDateTime } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { PayrollBreakdown } from '../shared/PayrollScreen';
import { computeHrdPayrollRow } from '../../utils/payroll';
import { currentPeriod } from '../../utils/date';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function HrdDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'HrdDetail'>>();
  const navigation = useAppNavigation();
  const sessionUser = useSessionUser();
  const { showToast } = useToast();
  const { getUser, getCompensation, company, submissions, setUserStatus, deleteUser } = useApp();

  const [confirmStatus, setConfirmStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hrd = getUser(route.params.userId);
  const compensation = getCompensation(hrd?.id);

  const payrollRow = useMemo(() => {
    if (!hrd || !compensation) return undefined;
    return computeHrdPayrollRow(hrd, compensation, company, currentPeriod());
  }, [compensation, company, hrd]);

  const reviewed = useMemo(
    () =>
      submissions
        .filter((submission) =>
          submission.approvals.some((step) => step.actorId === hrd?.id),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [hrd?.id, submissions],
  );

  if (sessionUser.role !== 'OWNER') {
    return (
      <Screen header={<ScreenHeader title="Detail HRD" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Detail akun Admin/HRD hanya dapat diakses Owner."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  if (!hrd) {
    return (
      <Screen header={<ScreenHeader title="Detail HRD" onBack={() => navigation.goBack()} />}>
        <EmptyState
          icon={UserCog}
          title="Akun HRD tidak ditemukan"
          description="Data mungkin sudah dihapus dari mock state."
        />
      </Screen>
    );
  }

  const nextStatus = hrd.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return (
    <Screen
      header={
        <ScreenHeader
          title={hrd.name}
          subtitle={`${hrd.employeeCode} · Admin/HRD`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button
            label="Edit akun"
            icon={Pencil}
            onPress={() => navigation.navigate('HrdForm', { userId: hrd.id })}
          />
          <Button
            label={compensation ? 'Atur komponen gaji' : 'Lengkapi komponen gaji'}
            variant="secondary"
            icon={Wallet}
            onPress={() => navigation.navigate('HrdCompensation', { userId: hrd.id })}
          />
          <Button
            label={nextStatus === 'ACTIVE' ? 'Aktifkan akun' : 'Nonaktifkan akun'}
            variant="outline"
            onPress={() => setConfirmStatus(true)}
          />
        </View>
      }
    >
      <Card style={styles.profileCard}>
        <Avatar name={hrd.name} size={68} />
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="title" align="center">
            {hrd.name}
          </AppText>
          <View style={styles.badgeRow}>
            <RoleBadge role={hrd.role} />
            <AccountStatusBadge status={hrd.status} />
            {hrd.isDemoAccount ? <Badge label="Akun demo" tone="violet" /> : null}
          </View>
          <AppText variant="caption" align="center">
            Bergabung {formatDate(hrd.joinDate)} · {EMPLOYMENT_TYPE_LABEL[hrd.employmentType]}
          </AppText>
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="subtitle">Informasi akun</AppText>
        <Divider />
        <DetailRow label="Email" value={hrd.email} icon={Mail} />
        <DetailRow label="Telepon" value={hrd.phone} icon={Phone} />
        <DetailRow label="Username" value={hrd.username} />
        <DetailRow label="Kode karyawan" value={hrd.employeeCode} />
        <DetailRow label="Status kepegawaian" value={EMPLOYMENT_TYPE_LABEL[hrd.employmentType]} />
        <DetailRow label="Keputusan pengajuan" value={`${reviewed.length} tercatat`} />
        {hrd.notes ? <InfoNote icon={ShieldCheck} tone="neutral" body={hrd.notes} /> : null}
      </Card>

      <SectionHeader
        title="Komponen gaji"
        subtitle={compensation ? `Diperbarui ${formatDateTime(compensation.updatedAt)}` : 'Belum diatur'}
        actionLabel="Ubah"
        onAction={() => navigation.navigate('HrdCompensation', { userId: hrd.id })}
      />
      {compensation && payrollRow ? (
        <>
          <Card tone="dark" style={styles.payrollHero}>
            <AppText style={styles.payrollEyebrow}>GAJI BULANAN TETAP</AppText>
            <AppText style={styles.payrollValue}>{formatCurrency(payrollRow.grossEarned)}</AppText>
            <AppText style={styles.payrollHint}>
              Take home simulasi · {company.workDaysPerMonth} hari kerja
            </AppText>
          </Card>
          <Card style={styles.section}>
            <PayrollBreakdown row={payrollRow} />
          </Card>
        </>
      ) : (
        <Card style={styles.section}>
          <View style={styles.emptyRow}>
            <Coins size={20} color={colors.warningDark} strokeWidth={2} />
            <AppText variant="small" style={{ flex: 1 }}>
              Akun HRD ini belum memiliki komponen gaji sehingga tidak muncul pada rekap payroll.
            </AppText>
          </View>
          <Button
            label="Lengkapi komponen gaji"
            variant="warning"
            size="sm"
            icon={Wallet}
            onPress={() => navigation.navigate('HrdCompensation', { userId: hrd.id })}
          />
        </Card>
      )}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ShieldCheck}
        tone="neutral"
        title="Kewenangan HRD"
        body="HRD memverifikasi pengajuan tahap pertama, mengelola data karyawan, role, lokasi, dan kuota cuti. Persetujuan final tetap milik Owner."
      />

      <SectionHeader title="Aktivitas persetujuan" subtitle={`${reviewed.length} pengajuan pernah diproses`} />
      <Card padded={false}>
        {reviewed.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Belum ada keputusan"
            description="Keputusan verifikasi HRD akan tercatat di sini."
          />
        ) : (
          reviewed.slice(0, 5).map((submission, index) => {
            const step = submission.approvals.find((item) => item.actorId === hrd.id);
            return (
              <View
                key={submission.id}
                style={[styles.activityRow, index < Math.min(reviewed.length, 5) - 1 && styles.activityBorder]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="smallStrong">
                    {submission.code} ·{' '}
                    {step
                      ? step.decision === 'APPROVED'
                        ? 'Disetujui HRD'
                        : 'Ditolak HRD'
                      : 'Pengajuan'}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {step ? `${step.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'} · ${step.note}` : '—'}
                  </AppText>
                </View>
                <Badge
                  label={submission.status === 'PENDING_HRD' ? 'Menunggu' : submission.status === 'FULLY_APPROVED' ? 'Final' : 'Selesai'}
                  tone={
                    submission.status === 'FULLY_APPROVED'
                      ? 'success'
                      : submission.status === 'PENDING_HRD'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              </View>
            );
          })
        )}
      </Card>

      <SectionHeader title="Zona berbahaya" subtitle="Tindakan Owner" />
      <Card tone="danger" style={styles.section}>
        <AppText variant="bodyStrong" color={colors.dangerDark}>
          Hapus akun HRD
        </AppText>
        <AppText variant="caption" color={colors.dangerDark} style={{ lineHeight: 16 }}>
          Akun demo tidak dapat dihapus. Akun HRD lain dapat dihapus beserta komponen gajinya.
        </AppText>
        <Button
          label="Hapus akun"
          variant="danger"
          size="sm"
          disabled={Boolean(hrd.isDemoAccount)}
          onPress={() => setConfirmDelete(true)}
        />
      </Card>

      <ConfirmDialog
        visible={confirmStatus}
        title={nextStatus === 'INACTIVE' ? 'Nonaktifkan akun HRD?' : 'Aktifkan akun HRD?'}
        message={
          nextStatus === 'INACTIVE'
            ? 'HRD tidak dapat login dan memverifikasi pengajuan sampai akun diaktifkan kembali.'
            : 'HRD akan dapat login kembali dengan akses yang sama.'
        }
        confirmLabel={nextStatus === 'INACTIVE' ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        tone={nextStatus === 'INACTIVE' ? 'danger' : 'success'}
        onConfirm={() => {
          const result = setUserStatus(hrd.id, nextStatus);
          setConfirmStatus(false);
          showToast(result.message, result.ok ? 'success' : 'error');
        }}
        onCancel={() => setConfirmStatus(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus akun HRD?"
        message={`${hrd.name} akan dihapus dari mock state. Riwayat approval yang sudah tercatat tetap tersimpan pada pengajuan.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        onConfirm={() => {
          const result = deleteUser(hrd.id);
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

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
  profileCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  section: { marginTop: spacing.md, gap: spacing.sm },
  payrollHero: { gap: 2 },
  payrollEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  payrollValue: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.white },
  payrollHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
