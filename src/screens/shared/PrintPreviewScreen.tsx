import { RouteProp, useRoute } from '@react-navigation/native';
import { Building2, Info, Printer, ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { useToast } from '../../components/common/Toast';
import {
  LEAVE_CATEGORY_LABEL,
  SUBMISSION_TYPE_LABEL,
} from '../../constants';
import { useApp } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDate, formatDateRange, formatDateTime } from '../../utils/date';
import { useAppNavigation, AppParamList } from '../../navigation/types';

const DOC_TITLE = {
  LEAVE: 'SURAT PERSETUJUAN CUTI',
  PERMISSION: 'SURAT PERSETUJUAN IZIN',
  SICK: 'SURAT PERSETUJUAN CUTI SAKIT',
  RESIGN: 'SURAT PERSETUJUAN PENGUNDURAN DIRI',
} as const;

export function PrintPreviewScreen() {
  const route = useRoute<RouteProp<AppParamList, 'PrintPreview'>>();
  const navigation = useAppNavigation();
  const { showToast } = useToast();
  const { submissions, getUser, getRoleForUser, company } = useApp();

  const submission = submissions.find((item) => item.id === route.params.submissionId);
  const employee = getUser(submission?.userId);
  const role = getRoleForUser(employee);
  const canPrint = submission?.status === 'FULLY_APPROVED';

  if (!submission || !employee) {
    return (
      <Screen header={<ScreenHeader title="Pratinjau surat" onBack={() => navigation.goBack()} />}>
        <InfoNote icon={Info} tone="danger" body="Pengajuan tidak ditemukan." />
      </Screen>
    );
  }

  const hrdStep = submission.approvals.find((step) => step.stage === 'HRD');
  const ownerStep = submission.approvals.find((step) => step.stage === 'OWNER');

  const handlePrint = () => {
    if (!canPrint) {
      showToast('Surat belum dapat dicetak sebelum disetujui penuh.', 'warning');
      return;
    }
    showToast(
      'Pratinjau dokumen siap. Generator PDF/QR belum tersedia.',
      'info',
      'Aksi cetak belum tersedia',
    );
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Pratinjau surat"
          subtitle={`${submission.code} · ${SUBMISSION_TYPE_LABEL[submission.type]}`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label="Cetak / simpan" icon={Printer} onPress={handlePrint} disabled={!canPrint} />}
    >
      {!canPrint ? (
        <InfoNote
          icon={ShieldAlert}
          tone="danger"
          title="Dokumen terkunci"
          body="Surat hanya dapat dicetak setelah pengajuan berstatus FULLY_APPROVED (disetujui HRD dan Owner)."
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      <View style={styles.paper}>
        <View style={styles.letterhead}>
          <View style={styles.logo}>
            <Building2 size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.letterheadText}>
            <AppText style={styles.companyName}>{company.legalName}</AppText>
            <AppText style={styles.companyMeta}>
              {company.address}, {company.city}
            </AppText>
            <AppText style={styles.companyMeta}>
              {company.phone} · {company.email}
            </AppText>
          </View>
        </View>
        <View style={styles.line} />

        <View style={styles.docBadge}>
          <Badge label="PRATINJAU DOKUMEN" tone="warning" />
        </View>

        <AppText style={styles.docTitle}>{DOC_TITLE[submission.type]}</AppText>
        <AppText style={styles.docNumber}>
          Nomor: {submission.code}/{new Date(submission.createdAt).getFullYear()}/HRD-ABSENSIPRO
        </AppText>

        <AppText style={styles.paragraph}>
          Yang bertanda tangan di bawah ini, Admin/HRD dan Owner {company.name}, menerangkan bahwa
          pengajuan berikut telah disetujui sesuai alur persetujuan berjenjang pada sistem AbsensiPro:
        </AppText>

        <View style={styles.table}>
          <Row label="Nama karyawan" value={employee.name} />
          <Row label="Kode karyawan" value={employee.employeeCode} />
          <Row label="Jabatan / role" value={role?.name ?? SUBMISSION_TYPE_LABEL[submission.type]} />
          <Row label="Jenis pengajuan" value={SUBMISSION_TYPE_LABEL[submission.type]} />
          {submission.leaveCategory ? (
            <Row label="Kategori cuti" value={LEAVE_CATEGORY_LABEL[submission.leaveCategory]} />
          ) : null}
          <Row label="Tanggal" value={formatDateRange(submission.startDate, submission.endDate)} />
          <Row label="Durasi" value={`${submission.days} hari`} />
          <Row label="Alasan" value={submission.reason} />
        </View>

        <AppText style={styles.paragraph}>
          Demikian surat ini dibuat berdasarkan data absensi dan pengajuan pada aplikasi. Surat ini
          merupakan pratinjau dan belum menjadi dokumen resmi perusahaan.
        </AppText>

        <View style={styles.signatureRow}>
          <SignatureBlock
            title="Admin / HRD"
            name={hrdStep?.actorName ?? '—'}
            meta={hrdStep ? formatDateTime(hrdStep.decidedAt) : 'Belum ada keputusan'}
            approved={hrdStep?.decision === 'APPROVED'}
          />
          <SignatureBlock
            title="Owner"
            name={ownerStep?.actorName ?? '—'}
            meta={ownerStep ? formatDateTime(ownerStep.decidedAt) : 'Belum ada keputusan'}
            approved={ownerStep?.decision === 'APPROVED'}
          />
        </View>

        <View style={styles.docFooter}>
          <AppText style={styles.docFooterText}>
            Dicetak dari AbsensiPro · {formatDate(new Date().toISOString().slice(0, 10))} · data server
          </AppText>
        </View>
      </View>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="warning"
        title="Belum ada PDF resmi atau QR verifikasi"
        body="Pratinjau ini hanya menampilkan tata letak surat. Generator PDF, tanda tangan digital, dan QR verifikasi perlu dikerjakan pada fase berikutnya."
      />
      <Button
        label="Kembali ke detail pengajuan"
        variant="secondary"
        onPress={() => navigation.goBack()}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

function SignatureBlock({
  title,
  name,
  meta,
  approved,
}: {
  title: string;
  name: string;
  meta: string;
  approved: boolean;
}) {
  return (
    <View style={styles.signature}>
      <AppText style={styles.signatureTitle}>{title}</AppText>
      <View style={styles.signatureSpace}>
        {approved ? <Badge label="Disetujui" tone="success" /> : <Badge label="Menunggu" tone="neutral" />}
      </View>
      <AppText style={styles.signatureName}>{name}</AppText>
      <AppText style={styles.signatureMeta}>{meta}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  letterhead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  logo: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterheadText: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: '700', color: colors.primary },
  companyMeta: { fontSize: 9.5, color: colors.textSecondary, lineHeight: 14 },
  line: { height: 2, backgroundColor: colors.primary, marginVertical: spacing.sm },
  docBadge: { alignItems: 'flex-end' },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: spacing.sm,
  },
  docNumber: { fontSize: 10.5, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  paragraph: { fontSize: 11, lineHeight: 18, color: colors.text, textAlign: 'justify' },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.xs, overflow: 'hidden', marginVertical: spacing.sm },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { width: '36%', fontSize: 10.5, color: colors.textSecondary, padding: 7, backgroundColor: colors.surfaceMuted },
  rowValue: { flex: 1, fontSize: 10.5, color: colors.text, padding: 7 },
  signatureRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  signature: { flex: 1, gap: 4 },
  signatureTitle: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary },
  signatureSpace: { height: 46, justifyContent: 'center' },
  signatureName: { fontSize: 11, fontWeight: '700', color: colors.text, borderTopWidth: 1, borderTopColor: colors.borderStrong, paddingTop: 4 },
  signatureMeta: { fontSize: 9, color: colors.textMuted },
  docFooter: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  docFooterText: { fontSize: 8.5, color: colors.textMuted, textAlign: 'center' },
});
