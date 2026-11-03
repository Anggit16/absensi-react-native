import { RouteProp, useRoute } from '@react-navigation/native';
import {
  CalendarCheck,
  CalendarDays,
  Info,
  Minus,
  Plus,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/date';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function LeaveAllocationDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'LeaveAllocationDetail'>>();
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { showToast } = useToast();
  const { getUser, getBalance, getRoleForUser, adjustLeaveBalance, submissions } = useApp();

  const employee = getUser(route.params.userId);
  const balance = getBalance(route.params.userId);
  const role = getRoleForUser(employee);

  const [delta, setDelta] = useState(1);
  const [direction, setDirection] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const remaining = balance ? balance.totalQuota - balance.used : 0;
  const signedDelta = direction === 'ADD' ? delta : -delta;
  const after = Math.max(0, remaining + signedDelta);
  const usagePercent = balance?.totalQuota
    ? Math.round(((balance.totalQuota - remaining) / balance.totalQuota) * 100)
    : 0;

  const annualSubmissions = useMemo(
    () =>
      submissions
        .filter(
          (submission) =>
            submission.userId === route.params.userId &&
            submission.type === 'LEAVE' &&
            submission.leaveCategory === 'ANNUAL',
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [route.params.userId, submissions],
  );

  if (user.role === 'EMPLOYEE' || !employee || !balance) {
    return (
      <Screen header={<ScreenHeader title="Kuota cuti" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description={
            user.role === 'EMPLOYEE'
              ? 'Penyesuaian kuota cuti hanya dapat dilakukan Admin/HRD.'
              : 'Data saldo cuti karyawan tidak ditemukan di server.'
          }
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const submitAdjustment = async () => {
    if (delta <= 0) {
      setError('Jumlah hari harus lebih dari 0.');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Alasan penyesuaian minimal 5 karakter.');
      return;
    }
    if (direction === 'SUBTRACT' && delta > remaining) {
      setError(`Tidak dapat mengurangi ${delta} hari. Sisa saldo saat ini ${remaining} hari.`);
      return;
    }

    const result = await adjustLeaveBalance({
      userId: employee.id,
      delta: signedDelta,
      reason: reason.trim(),
      actorName: user.name,
    });

    if (result.ok) {
      showToast(result.message, 'success', 'Kuota cuti diperbarui');
      setReason('');
      setDelta(1);
      setError('');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Atur kuota cuti"
          subtitle={`${employee.name} · ${employee.employeeCode}`}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.profile}>
        <Avatar name={employee.name} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="subtitle">{employee.name}</AppText>
          <AppText variant="caption">
            {role?.name ?? 'Karyawan'} · kuota role {role?.annualLeaveQuota ?? 0} hari
          </AppText>
          <Badge label={`Tahun ${balance.year}`} tone="neutral" />
        </View>
        <Button
          label="Payroll"
          size="sm"
          variant="secondary"
          fullWidth={false}
          icon={Wallet}
          onPress={() =>
            navigation.navigate('PayrollDetail', {
              userId: employee.id,
              period: new Date().toISOString().slice(0, 7),
            })
          }
        />
      </Card>

      <Card tone="dark" style={styles.hero}>
        <AppText style={styles.heroEyebrow}>SISA KUOTA SAAT INI</AppText>
        <AppText style={styles.heroValue}>{remaining} hari</AppText>
        <AppText style={styles.heroHint}>
          Kuota {balance.totalQuota} hari · terpakai {balance.used} hari
        </AppText>
        <ProgressBar
          value={usagePercent}
          tone={usagePercent > 75 ? 'warning' : 'accent'}
          height={6}
          style={{ backgroundColor: 'rgba(248,250,252,0.16)', marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Penyesuaian saldo" subtitle="Menambah atau mengurangi kuota tahunan" />
      <Card style={styles.formCard}>
        <View style={styles.segment}>
          <Button
            label="Tambah kuota"
            size="sm"
            variant={direction === 'ADD' ? 'success' : 'secondary'}
            icon={Plus}
            onPress={() => {
              setDirection('ADD');
              setError('');
            }}
            style={styles.segmentButton}
          />
          <Button
            label="Kurangi kuota"
            size="sm"
            variant={direction === 'SUBTRACT' ? 'danger' : 'secondary'}
            icon={Minus}
            onPress={() => {
              setDirection('SUBTRACT');
              setError('');
            }}
            style={styles.segmentButton}
          />
        </View>

        <View style={styles.stepperCard}>
          <AppText variant="caption">JUMLAH HARI</AppText>
          <View style={styles.stepperRow}>
            <Button
              label="−"
              size="sm"
              variant="secondary"
              fullWidth={false}
              onPress={() => setDelta((value) => Math.max(1, value - 1))}
              style={styles.stepperButton}
            />
            <AppText style={styles.stepperValue}>{delta}</AppText>
            <Button
              label="+"
              size="sm"
              variant="secondary"
              fullWidth={false}
              onPress={() => setDelta((value) => Math.min(60, value + 1))}
              style={styles.stepperButton}
            />
          </View>
          <AppText variant="caption">
            {direction === 'ADD' ? 'Saldo bertambah' : 'Saldo berkurang'} {delta} hari
          </AppText>
        </View>

        <View style={styles.previewBox}>
          <View style={styles.previewCol}>
            <AppText variant="caption">SISA SAAT INI</AppText>
            <AppText variant="bodyStrong">{remaining} hari</AppText>
          </View>
          <SlidersHorizontal size={16} color={colors.textMuted} strokeWidth={2.2} />
          <View style={[styles.previewCol, { alignItems: 'flex-end' }]}>
            <AppText variant="caption">SETELAH DISIMPAN</AppText>
            <AppText
              variant="bodyStrong"
              color={direction === 'ADD' ? colors.accentDark : colors.warningDark}
            >
              {after} hari
            </AppText>
          </View>
        </View>

        <TextField
          label="Alasan penyesuaian"
          value={reason}
          onChangeText={(value) => {
            setReason(value);
            setError('');
          }}
          placeholder="Contoh: carry over cuti tahun lalu"
          multiline
          numberOfLines={3}
          error={error}
          required
          helper="Alasan akan tercatat pada riwayat saldo karyawan."
        />

        <Button
          label="Simpan penyesuaian"
          variant={direction === 'ADD' ? 'success' : 'warning'}
          onPress={submitAdjustment}
        />
        <InfoNote
          icon={Info}
          tone="neutral"
          body="Penyesuaian manual mengubah total kuota, bukan pemakaian. Pemotongan otomatis dari cuti tahunan tetap terjadi satu kali saat approval final."
        />
      </Card>

      <SectionHeader title="Riwayat penyesuaian" subtitle={`${balance.adjustments.length} catatan`} />
      <Card padded={false}>
        {balance.adjustments.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Belum ada penyesuaian"
            description="Saldo masih memakai kuota awal role."
          />
        ) : (
          balance.adjustments.map((adjustment, index) => (
            <View
              key={adjustment.id}
              style={[
                styles.adjustRow,
                index < balance.adjustments.length - 1 && styles.adjustBorder,
              ]}
            >
              <Badge
                label={`${adjustment.delta > 0 ? '+' : ''}${adjustment.delta}`}
                tone={adjustment.delta > 0 ? 'success' : adjustment.delta < 0 ? 'warning' : 'neutral'}
              />
              <View style={{ flex: 1, gap: 1 }}>
                <AppText variant="smallStrong">{adjustment.reason}</AppText>
                <AppText variant="caption">
                  {formatDate(adjustment.at.slice(0, 10))} · {adjustment.byName}
                </AppText>
              </View>
            </View>
          ))
        )}
      </Card>

      <SectionHeader
        title="Pengajuan cuti tahunan"
        subtitle={`${annualSubmissions.length} pengajuan`}
        actionLabel="Approval"
        onAction={() => navigation.navigate('Approvals')}
      />
      {annualSubmissions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada pengajuan cuti tahunan"
          description="Pengajuan karyawan akan tampil di sini setelah dibuat."
        />
      ) : (
        annualSubmissions.slice(0, 4).map((submission) => (
          <View key={submission.id} style={{ marginBottom: spacing.sm }}>
            <SubmissionCard
              submission={submission}
              onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
            />
          </View>
        ))
      )}

      <Card style={[styles.formCard, { marginTop: spacing.md }]}>
        <AppText variant="caption" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
          RINGKASAN SALDO
        </AppText>
        <DetailRow label="Total kuota" value={`${balance.totalQuota} hari`} icon={CalendarCheck} />
        <DetailRow label="Terpakai (approval final)" value={`${balance.used} hari`} />
        <DetailRow label="Sisa" value={`${remaining} hari`} strong />
        <Divider />
        <AppText variant="caption" style={{ lineHeight: 16 }}>
          Saldo dihitung dari total kuota dikurangi pemakaian. Penyesuaian manual tidak mengubah
          angka pemakaian, sehingga laporan tetap dapat diaudit.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hero: { marginTop: spacing.md, gap: 2 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  formCard: { gap: spacing.md },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentButton: { flex: 1 },
  stepperCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepperButton: { width: 44 },
  stepperValue: { fontSize: 26, fontWeight: '700', color: colors.primary, minWidth: 52, textAlign: 'center' },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  previewCol: { gap: 2, flex: 1 },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  adjustBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
