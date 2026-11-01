import { RouteProp, useRoute } from '@react-navigation/native';
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Info,
  Lock,
  Paperclip,
  Printer,
  XCircle,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge, SubmissionStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { BottomSheet, ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider } from '../../components/common/Section';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { ApprovalTimeline } from '../../components/approval/ApprovalTimeline';
import {
  LEAVE_CATEGORY_DESCRIPTION,
  LEAVE_CATEGORY_LABEL,
  SUBMISSION_STATUS_DESCRIPTION,
  SUBMISSION_TYPE_LABEL,
} from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDate, formatDateTime, formatDateRange } from '../../utils/date';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function SubmissionDetailScreen() {
  const route = useRoute<RouteProp<AppParamList, 'SubmissionDetail'>>();
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { showToast } = useToast();
  const {
    submissions,
    getUser,
    getRoleForUser,
    getBalance,
    decideSubmission,
    cancelSubmission,
  } = useApp();

  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const submission = submissions.find((item) => item.id === route.params.submissionId);
  const employee = getUser(submission?.userId);
  const employeeRole = getRoleForUser(employee);
  const balance = getBalance(submission?.userId);

  const stage: 'HRD' | 'OWNER' = user.role === 'HRD' ? 'HRD' : 'OWNER';
  const canDecide =
    !!submission &&
    ((user.role === 'HRD' && submission.status === 'PENDING_HRD') ||
      (user.role === 'OWNER' && submission.status === 'PENDING_OWNER'));
  const canCancel = !!submission && submission.userId === user.id && submission.status === 'PENDING_HRD';
  const canPrint = submission?.status === 'FULLY_APPROVED';

  const printHint = useMemo(() => {
    if (!submission) return '';
    switch (submission.status) {
      case 'PENDING_HRD':
        return 'Surat baru dapat dicetak setelah verifikasi HRD dan persetujuan Owner.';
      case 'PENDING_OWNER':
        return 'Sudah lolos HRD. Surat aktif setelah Owner menyetujui.';
      case 'REJECTED':
        return 'Pengajuan ditolak sehingga surat tidak dapat dicetak.';
      case 'CANCELLED':
        return 'Pengajuan dibatalkan oleh karyawan sehingga surat tidak tersedia.';
      default:
        return 'Pengajuan disetujui penuh. Surat siap dicetak (preview simulasi).';
    }
  }, [submission]);

  if (!submission || !employee) {
    return (
      <Screen header={<ScreenHeader title="Detail pengajuan" onBack={() => navigation.goBack()} />}>
        <InfoNote icon={Info} tone="danger" body="Pengajuan tidak ditemukan pada data demo." />
      </Screen>
    );
  }

  const balanceAfter = balance ? balance.totalQuota - balance.used : 0;

  const submitDecision = () => {
    if (!decision) return;
    if (decision === 'REJECTED' && note.trim().length < 5) {
      setNoteError('Catatan penolakan minimal 5 karakter agar alasan jelas.');
      return;
    }
    const result = decideSubmission({
      submissionId: submission.id,
      stage,
      decision,
      note,
      actorId: user.id,
    });
    if (result.ok) {
      setDecision(null);
      setNote('');
      setNoteError('');
      showToast(result.message, 'success', decision === 'APPROVED' ? 'Pengajuan disetujui' : 'Pengajuan ditolak');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Detail pengajuan"
          subtitle={`${submission.code} · ${SUBMISSION_TYPE_LABEL[submission.type]}`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <View style={styles.footer}>
          {canDecide ? (
            <View style={styles.footerRow}>
              <Button
                label="Tolak"
                variant="outline"
                icon={XCircle}
                onPress={() => {
                  setDecision('REJECTED');
                  setNote('');
                  setNoteError('');
                }}
                style={[styles.footerButton, { borderColor: colors.dangerSoft }]}
              />
              <Button
                label={stage === 'HRD' ? 'Setujui & teruskan' : 'Setujui final'}
                variant="success"
                icon={CheckCircle2}
                onPress={() => {
                  setDecision('APPROVED');
                  setNote('');
                  setNoteError('');
                }}
                style={styles.footerButton}
              />
            </View>
          ) : null}

          <Button
            label={canPrint ? 'Cetak surat pengajuan' : 'Cetak surat (terkunci)'}
            variant={canPrint ? 'primary' : 'secondary'}
            icon={canPrint ? Printer : Lock}
            disabled={!canPrint}
            onPress={() => navigation.navigate('PrintPreview', { submissionId: submission.id })}
          />
          <AppText variant="caption" align="center" style={styles.footerHint}>
            {printHint}
          </AppText>

          {canCancel ? (
            <Button
              label="Batalkan pengajuan"
              variant="ghost"
              size="sm"
              onPress={() => setConfirmCancel(true)}
            />
          ) : null}
        </View>
      }
    >
      <Card tone="dark" style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View style={styles.statusText}>
            <AppText style={styles.statusEyebrow}>{submission.code}</AppText>
            <AppText style={styles.statusTitle}>{SUBMISSION_STATUS_DESCRIPTION[submission.status]}</AppText>
          </View>
          <SubmissionStatusBadge status={submission.status} />
        </View>
        <View style={styles.statusMeta}>
          <Badge label={`${submission.days} hari`} tone="dark" />
          <Badge label={formatDateRange(submission.startDate, submission.endDate)} tone="dark" />
          <Badge label={`Diajukan ${formatDate(submission.createdAt.slice(0, 10))}`} tone="dark" />
        </View>
      </Card>

      {user.role !== 'EMPLOYEE' ? (
        <Card style={styles.employeeCard}>
          <Avatar name={employee.name} size={46} />
          <View style={styles.employeeText}>
            <AppText variant="bodyStrong">{employee.name}</AppText>
            <AppText variant="caption">
              {employeeRole?.name ?? 'Karyawan'} · {employee.employeeCode}
            </AppText>
          </View>
          <Badge label={employeeRole?.department ?? 'Karyawan'} tone="neutral" />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <AppText variant="subtitle">Informasi pengajuan</AppText>
        <Divider />
        <DetailRow label="Jenis" value={SUBMISSION_TYPE_LABEL[submission.type]} />
        {submission.leaveCategory ? (
          <DetailRow label="Kategori cuti" value={LEAVE_CATEGORY_LABEL[submission.leaveCategory]} />
        ) : null}
        {submission.permissionType ? <DetailRow label="Tipe izin" value={submission.permissionType} /> : null}
        <DetailRow label="Tanggal" value={formatDateRange(submission.startDate, submission.endDate)} />
        <DetailRow label="Durasi" value={`${submission.days} hari (inklusif)`} />
        {submission.resignEffectiveDate ? (
          <DetailRow label="Efektif resign" value={formatDate(submission.resignEffectiveDate)} />
        ) : null}
        <DetailRow label="Diajukan pada" value={formatDateTime(submission.createdAt)} />
        <Divider />
        <View style={styles.reasonBlock}>
          <AppText variant="caption">Alasan</AppText>
          <AppText variant="body" style={{ marginTop: 4 }}>
            {submission.reason}
          </AppText>
        </View>
        {submission.attachmentName ? (
          <View style={styles.attachment}>
            <Paperclip size={13} color={colors.infoDark} strokeWidth={2.2} />
            <AppText variant="caption" style={{ color: colors.infoDark, flex: 1 }}>
              {submission.attachmentName}
            </AppText>
            <Badge label="Simulasi lampiran" tone="info" />
          </View>
        ) : null}
      </Card>

      {submission.type === 'LEAVE' && submission.leaveCategory ? (
        <Card style={styles.section}>
          <AppText variant="subtitle">Dampak kuota & payroll</AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {LEAVE_CATEGORY_DESCRIPTION[submission.leaveCategory]}
          </AppText>
          {submission.leaveCategory === 'ANNUAL' && balance ? (
            <>
              <Divider />
              <DetailRow label="Saldo saat ini" value={`${balanceAfter} hari`} />
              <DetailRow
                label={submission.balanceApplied ? 'Sudah dipotong' : 'Akan dipotong setelah final'}
                value={`${submission.days} hari`}
                valueColor={submission.balanceApplied ? colors.text : colors.warningDark}
              />
              <DetailRow
                label="Saldo setelah disetujui"
                value={`${submission.balanceApplied ? balanceAfter : balanceAfter - submission.days} hari`}
                strong
              />
              <InfoNote
                tone={submission.balanceApplied ? 'success' : 'warning'}
                icon={Info}
                body={
                  submission.balanceApplied
                    ? 'Kuota sudah dipotong satu kali saat persetujuan final. Tidak akan terpotong ulang.'
                    : 'Kuota belum berubah. Pemotongan hanya terjadi satu kali setelah Owner menyetujui.'
                }
              />
            </>
          ) : null}
          {submission.leaveCategory === 'UNPAID' ? (
            <InfoNote
              style={{ marginTop: spacing.sm }}
              tone="warning"
              icon={Info}
              body={`Gaji pokok harian untuk ${submission.days} hari cuti tanpa gaji tidak dibayarkan pada rekap payroll.`}
            />
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.section}>
        <AppText variant="subtitle">Alur persetujuan</AppText>
        <AppText variant="caption" style={{ marginBottom: spacing.md }}>
          Karyawan → HRD → Owner
        </AppText>
        <ApprovalTimeline submission={submission} submittedByName={employee.name} />
      </Card>

      <Card style={styles.section}>
        <View style={styles.printHeader}>
          <View style={styles.printIcon}>
            <FileText size={16} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Surat pengajuan</AppText>
            <AppText variant="caption">{printHint}</AppText>
          </View>
          <Badge
            label={canPrint ? 'Siap cetak' : 'Terkunci'}
            tone={canPrint ? 'success' : 'neutral'}
          />
        </View>
        {canPrint ? (
          <View style={styles.printMeta}>
            <CalendarDays size={13} color={colors.textMuted} strokeWidth={2} />
            <AppText variant="caption">
              Disetujui penuh · {submission.approvals.length} keputusan tercatat
            </AppText>
          </View>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <AppText variant="subtitle">Catatan keputusan</AppText>
        {submission.approvals.length === 0 ? (
          <AppText variant="small" style={{ marginTop: 4 }}>
            Belum ada catatan. Keputusan HRD dan Owner akan tercatat di sini.
          </AppText>
        ) : (
          submission.approvals.map((step, index) => (
            <View key={`${step.stage}-${index}`} style={styles.approvalNote}>
              <View style={styles.approvalNoteHeader}>
                <Badge
                  label={`${step.stage} · ${step.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`}
                  tone={step.decision === 'APPROVED' ? 'success' : 'danger'}
                />
                <AppText variant="caption">{formatDateTime(step.decidedAt)}</AppText>
              </View>
              <AppText variant="small" style={{ color: colors.textSecondary, marginTop: 4 }}>
                {step.note}
              </AppText>
              <AppText variant="caption" style={{ marginTop: 2 }}>
                oleh {step.actorName}
              </AppText>
            </View>
          ))
        )}
        {submission.balanceApplied ? (
          <InfoNote
            style={{ marginTop: spacing.sm }}
            tone="success"
            icon={CheckCircle2}
            body={`Saldo cuti tahunan telah dipotong ${submission.days} hari dan ditandai agar tidak terpotong dua kali.`}
          />
        ) : null}
      </Card>

      <BottomSheet
        visible={decision !== null}
        onClose={() => setDecision(null)}
        title={decision === 'APPROVED' ? 'Setujui pengajuan' : 'Tolak pengajuan'}
        subtitle={`${submission.code} · ${employee.name}`}
        footer={
          <Button
            label={decision === 'APPROVED' ? (stage === 'HRD' ? 'Ya, setujui & teruskan' : 'Ya, setujui final') : 'Ya, tolak pengajuan'}
            variant={decision === 'APPROVED' ? 'success' : 'danger'}
            onPress={submitDecision}
          />
        }
      >
        <InfoNote
          tone={decision === 'APPROVED' ? 'info' : 'danger'}
          icon={Info}
          body={
            stage === 'HRD'
              ? decision === 'APPROVED'
                ? 'Pengajuan akan diteruskan ke Owner. Kuota cuti belum berubah sampai Owner menyetujui.'
                : 'Penolakan HRD menghentikan alur. Pengajuan tidak akan muncul di daftar Owner.'
              : decision === 'APPROVED'
                ? 'Persetujuan final akan mengubah status menjadi FULLY_APPROVED dan (untuk cuti tahunan) memotong kuota satu kali.'
                : 'Penolakan Owner mengakhiri proses dan pengajuan berstatus REJECTED.'
          }
        />
        <TextField
          label={decision === 'APPROVED' ? 'Catatan (opsional)' : 'Catatan penolakan'}
          placeholder={
            decision === 'APPROVED'
              ? 'Contoh: Disetujui, pastikan handover pekerjaan selesai.'
              : 'Jelaskan alasan penolakan agar karyawan dapat memperbaiki.'
          }
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setNoteError('');
          }}
          multiline
          numberOfLines={4}
          error={noteError}
          required={decision === 'REJECTED'}
          helper={decision === 'REJECTED' ? 'Catatan wajib diisi minimal 5 karakter.' : undefined}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={confirmCancel}
        title="Batalkan pengajuan?"
        message="Pengajuan akan berstatus dibatalkan dan tidak dapat diproses HRD. Anda dapat membuat pengajuan baru."
        confirmLabel="Ya, batalkan"
        tone="danger"
        onConfirm={() => {
          const result = cancelSubmission(submission.id, user.id);
          setConfirmCancel(false);
          if (result.ok) showToast(result.message, 'success');
          else showToast(result.message, 'error');
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
  footerHint: { color: colors.textMuted, fontSize: 10.5 },
  statusCard: { gap: spacing.md },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
  statusText: { flex: 1, gap: 2 },
  statusEyebrow: { fontSize: 10.5, letterSpacing: 0.7, fontWeight: '700', color: colors.textOnDarkMuted },
  statusTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.white },
  statusMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  employeeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  employeeText: { flex: 1, gap: 1 },
  section: { marginTop: spacing.md, gap: spacing.sm },
  reasonBlock: { paddingVertical: 2 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  printHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  printIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  approvalNote: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  approvalNoteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
