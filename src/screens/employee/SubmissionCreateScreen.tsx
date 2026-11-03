import {
  AlertTriangle,
  CalendarDays,
  FilePlus2,
  HeartPulse,
  Info,
  LogOut,
  Paperclip,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote, ProgressBar } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { Divider, SectionHeader } from '../../components/common/Section';
import { DateField } from '../../components/common/DateField';
import { SelectField } from '../../components/common/SelectField';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { SegmentedTabs } from '../../components/common/SegmentedTabs';
import {
  LEAVE_CATEGORY_DESCRIPTION,
  LEAVE_CATEGORY_LABEL,
  PERMISSION_TYPES,
  SUBMISSION_TYPE_DESCRIPTION,
  SUBMISSION_TYPE_LABEL,
} from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { addDays, formatDate, inclusiveDays, todayISO } from '../../utils/date';
import type { LeaveCategory, SubmissionType } from '../../types';
import { useAppNavigation } from '../../navigation/types';

const TYPE_ICONS = {
  LEAVE: CalendarDays,
  PERMISSION: FilePlus2,
  SICK: HeartPulse,
  RESIGN: LogOut,
} as const;

export function SubmissionCreateScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { showToast } = useToast();
  const { createSubmission, getBalance, getRoleForUser } = useApp();

  const today = todayISO();
  const balance = getBalance(user.id);
  const remaining = balance ? balance.totalQuota - balance.used : 0;
  const role = getRoleForUser(user);

  const [type, setType] = useState<SubmissionType>('LEAVE');
  const [leaveCategory, setLeaveCategory] = useState<LeaveCategory>('ANNUAL');
  const [permissionType, setPermissionType] = useState<string>(PERMISSION_TYPES[0]);
  const [startDate, setStartDate] = useState(addDays(today, 1));
  const [endDate, setEndDate] = useState(addDays(today, 1));
  const [resignDate, setResignDate] = useState(addDays(today, 30));
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSick = type === 'SICK' || (type === 'LEAVE' && leaveCategory === 'SICK_LEAVE');
  const minDate = type === 'SICK' ? addDays(today, -14) : today;

  const days = useMemo(() => {
    if (type === 'RESIGN') return 1;
    if (!startDate || !endDate) return 0;
    return inclusiveDays(startDate, endDate);
  }, [endDate, startDate, type]);

  const quotaAfter = leaveCategory === 'ANNUAL' ? remaining - days : remaining;

  const resetErrors = (key: string) => setErrors((previous) => ({ ...previous, [key]: '' }));

  const changeType = (value: SubmissionType) => {
    setType(value);
    setErrors({});
    if (value === 'RESIGN') {
      setStartDate(resignDate);
      setEndDate(resignDate);
    }
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (reason.trim().length < 10) nextErrors.reason = 'Alasan minimal 10 karakter.';
    if (type !== 'RESIGN' && days <= 0) nextErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai.';
    if (type !== 'RESIGN' && endDate < startDate) {
      nextErrors.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    }
    if (type === 'LEAVE' && leaveCategory === 'ANNUAL' && days > remaining) {
      nextErrors.days = `Sisa cuti tahunan Anda ${remaining} hari, pengajuan ${days} hari.`;
    }
    if (isSick && !attachmentName) nextErrors.attachment = 'Surat dokter wajib dilampirkan.';
    if (type === 'RESIGN' && !resignDate) nextErrors.resignDate = 'Tanggal efektif resign wajib diisi.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali data pengajuan.', 'error', 'Belum dapat dikirim');
      return;
    }

    const result = await createSubmission({
      userId: user.id,
      type,
      leaveCategory: type === 'LEAVE' ? leaveCategory : isSick ? 'SICK_LEAVE' : undefined,
      permissionType: type === 'PERMISSION' ? permissionType : undefined,
      startDate: type === 'RESIGN' ? resignDate : startDate,
      endDate: type === 'RESIGN' ? resignDate : endDate,
      days,
      reason,
      attachmentName: isSick ? attachmentName : undefined,
      resignEffectiveDate: type === 'RESIGN' ? resignDate : undefined,
    });

    if (result.ok && result.id) {
      showToast(result.message, 'success', 'Pengajuan terkirim');
      navigation.replace('SubmissionDetail', { submissionId: result.id });
      return;
    }
    showToast(result.message, 'error');
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Buat pengajuan"
          subtitle={`${user.name} · ${user.employeeCode}`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label="Kirim pengajuan" icon={FilePlus2} onPress={handleSubmit} />}
    >
      <SegmentedTabs
        scrollable
        value={type}
        onChange={(value) => changeType(value as SubmissionType)}
        options={[
          { value: 'LEAVE', label: 'Cuti' },
          { value: 'PERMISSION', label: 'Izin' },
          { value: 'SICK', label: 'Sakit' },
          { value: 'RESIGN', label: 'Resign' },
        ]}
        style={{ marginBottom: spacing.md }}
      />

      <Card tone="muted" style={styles.typeCard}>
        <View style={styles.typeIcon}>
          {React.createElement(TYPE_ICONS[type], {
            size: 20,
            color: colors.primary,
            strokeWidth: 2,
          })}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong">{SUBMISSION_TYPE_LABEL[type]}</AppText>
          <AppText variant="caption" style={{ lineHeight: 16 }}>
            {SUBMISSION_TYPE_DESCRIPTION[type]}
          </AppText>
        </View>
      </Card>

      <SectionHeader title="Detail pengajuan" subtitle="Isi data sesuai jenis pengajuan" />
      <Card style={styles.formCard}>
        {type === 'LEAVE' ? (
          <SelectField
            label="Kategori cuti"
            value={leaveCategory}
            required
            options={(Object.keys(LEAVE_CATEGORY_LABEL) as LeaveCategory[]).map((key) => ({
              value: key,
              label: LEAVE_CATEGORY_LABEL[key],
              description: LEAVE_CATEGORY_DESCRIPTION[key],
            }))}
            onChange={(value) => {
              setLeaveCategory(value as LeaveCategory);
              setErrors({});
            }}
            helper={LEAVE_CATEGORY_DESCRIPTION[leaveCategory]}
          />
        ) : null}

        {type === 'PERMISSION' ? (
          <SelectField
            label="Tipe izin"
            value={permissionType}
            required
            options={PERMISSION_TYPES.map((item) => ({ value: item, label: item }))}
            onChange={setPermissionType}
            helper="Izin pribadi tidak mengurangi kuota tahunan, namun memengaruhi perhitungan payroll."
          />
        ) : null}

        {type === 'RESIGN' ? (
          <DateField
            label="Tanggal efektif resign"
            value={resignDate}
            onChange={(value) => {
              setResignDate(value);
              setStartDate(value);
              setEndDate(value);
              resetErrors('resignDate');
            }}
            minDate={today}
            required
            error={errors.resignDate}
            helper="Pastikan proses handover dan administrasi selesai sebelum tanggal ini."
          />
        ) : (
          <View style={styles.dateRow}>
            <DateField
              label="Tanggal mulai"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                if (endDate < value) setEndDate(value);
                setErrors({});
              }}
              minDate={minDate}
              required
              containerStyle={styles.dateField}
            />
            <DateField
              label="Tanggal selesai"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                resetErrors('endDate');
              }}
              minDate={startDate}
              required
              error={errors.endDate}
              containerStyle={styles.dateField}
            />
          </View>
        )}

        <View style={styles.daysBox}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption">DURASI PENGAJUAN</AppText>
            <AppText variant="bodyStrong">
              {type === 'RESIGN' ? '1 pengajuan resign' : `${days} hari (inklusif)`}
            </AppText>
            {type !== 'RESIGN' ? (
              <AppText variant="caption">
                {startDate ? formatDate(startDate) : '—'} s.d. {endDate ? formatDate(endDate) : '—'}
              </AppText>
            ) : (
              <AppText variant="caption">Efektif {formatDate(resignDate)}</AppText>
            )}
          </View>
          <Badge
            label={days > 0 ? `${days} hari` : 'Belum valid'}
            tone={days > 0 ? 'success' : 'danger'}
          />
        </View>
        {errors.days ? <AppText style={styles.errorText}>{errors.days}</AppText> : null}
        <AppText variant="caption">
          Perhitungan belum mengecualikan hari libur nasional atau akhir pekan.
        </AppText>
      </Card>

      {type === 'LEAVE' && leaveCategory === 'ANNUAL' && balance ? (
        <>
          <SectionHeader title="Dampak kuota cuti" subtitle={`Tahun ${balance.year}`} />
          <Card style={styles.formCard}>
            <View style={styles.rowBetween}>
              <AppText variant="small">Sisa saat ini</AppText>
              <AppText variant="bodyStrong">{remaining} hari</AppText>
            </View>
            <View style={styles.rowBetween}>
              <AppText variant="small">Diajukan</AppText>
              <AppText variant="bodyStrong" color={colors.warningDark}>
                {days} hari
              </AppText>
            </View>
            <ProgressBar
              value={balance.totalQuota ? (Math.max(0, quotaAfter) / balance.totalQuota) * 100 : 0}
              tone={quotaAfter < 0 ? 'danger' : quotaAfter <= 3 ? 'warning' : 'accent'}
            />
            <View style={styles.rowBetween}>
              <AppText variant="caption">Total kuota {balance.totalQuota} hari</AppText>
              <AppText variant="caption" color={quotaAfter < 0 ? colors.dangerDark : colors.accentDark}>
                Sisa setelah disetujui: {Math.max(0, quotaAfter)} hari
              </AppText>
            </View>
            <InfoNote
              icon={Info}
              tone="warning"
              body="Kuota belum berkurang saat pengajuan dibuat. Pemotongan hanya terjadi satu kali setelah HRD dan Owner menyetujui."
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Alasan & lampiran" />
      <Card style={styles.formCard}>
        <TextField
          label="Alasan pengajuan"
          value={reason}
          onChangeText={(value) => {
            setReason(value);
            resetErrors('reason');
          }}
          placeholder={
            type === 'SICK'
              ? 'Jelaskan keluhan dan anjuran dokter…'
              : type === 'RESIGN'
                ? 'Jelaskan alasan pengunduran diri…'
                : 'Jelaskan alasan agar HRD dapat memverifikasi…'
          }
          multiline
          numberOfLines={4}
          required
          error={errors.reason}
          helper={`${reason.trim().length}/10 karakter minimum`}
        />

        {isSick ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label">
              Surat dokter <AppText style={{ color: colors.danger }}>*</AppText>
            </AppText>
            <Pressable
              onPress={() => {
                setAttachmentName(
                  `surat-dokter-${user.employeeCode.toLowerCase()}-${today}.pdf`,
                );
                resetErrors('attachment');
              }}
              accessibilityRole="button"
              accessibilityLabel="Lampirkan surat dokter"
              style={({ pressed }) => [
                styles.attachment,
                attachmentName ? styles.attachmentActive : null,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Paperclip
                size={16}
                color={attachmentName ? colors.accentDark : colors.textMuted}
                strokeWidth={2.2}
              />
              <View style={{ flex: 1 }}>
                <AppText variant="smallStrong" color={attachmentName ? colors.accentDark : colors.text}>
                  {attachmentName ?? 'Lampirkan surat dokter'}
                </AppText>
                <AppText variant="caption">
                  {attachmentName ? 'Nama lampiran siap dikirim' : 'Unggahan file belum tersedia'}
                </AppText>
              </View>
              <Badge label={attachmentName ? 'Terlampir' : 'Wajib'} tone={attachmentName ? 'success' : 'warning'} />
            </Pressable>
            {errors.attachment ? <AppText style={styles.errorText}>{errors.attachment}</AppText> : null}
          </View>
        ) : (
          <InfoNote
            icon={Paperclip}
            tone="neutral"
            body="Lampiran hanya diwajibkan untuk cuti sakit. Saat ini lampiran hanya berupa nama berkas; unggah file belum tersedia."
          />
        )}
      </Card>

      <SectionHeader title="Pratinjau alur" subtitle="Persetujuan berjenjang" />
      <Card style={styles.flowCard}>
        <FlowStep index={1} title="Pengajuan dikirim" body="Status menjadi PENDING_HRD." done />
        <View style={styles.flowLine} />
        <FlowStep index={2} title="Verifikasi HRD" body="Jika disetujui, diteruskan ke Owner. Jika ditolak, alur berhenti." />
        <View style={styles.flowLine} />
        <FlowStep
          index={3}
          title="Persetujuan Owner"
          body="Status FULLY_APPROVED. Surat aktif dan kuota cuti tahunan dipotong satu kali."
        />
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ShieldCheck}
        tone="neutral"
        body={`Pengajuan dikirim atas nama ${user.name} (${role?.name ?? 'Karyawan'}). Data tersimpan di server dan tetap ada setelah aplikasi ditutup.`}
      />

      {type === 'RESIGN' ? (
        <InfoNote
          style={{ marginTop: spacing.sm }}
          icon={AlertTriangle}
          tone="danger"
          title="Pengajuan resign tidak dapat dibatalkan setelah diverifikasi"
          body="Selama masih PENDING_HRD Anda dapat membatalkan melalui detail pengajuan. Setelah HRD memproses, keputusan tidak dapat ditarik."
        />
      ) : null}

      <Card style={[styles.formCard, { marginTop: spacing.md }]}>
        <View style={styles.rowBetween}>
          <AppText variant="small">Pemohon</AppText>
          <AppText variant="smallStrong">{user.name}</AppText>
        </View>
        <Divider />
        <View style={styles.rowBetween}>
          <UserRound size={14} color={colors.textMuted} strokeWidth={2} />
          <AppText variant="caption" style={{ flex: 1, textAlign: 'right' }}>
            {role?.name ?? 'Karyawan'} · {user.employeeCode}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

function FlowStep({
  index,
  title,
  body,
  done = false,
}: {
  index: number;
  title: string;
  body: string;
  done?: boolean;
}) {
  return (
    <View style={styles.flowStep}>
      <View style={[styles.flowDot, done && styles.flowDotDone]}>
        <AppText style={[styles.flowDotText, done && { color: colors.white }]}>{index}</AppText>
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="smallStrong">{title}</AppText>
        <AppText variant="caption" style={{ lineHeight: 16 }}>
          {body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: { gap: spacing.md },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1 },
  daysBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  errorText: { color: colors.dangerDark, fontSize: 11, fontWeight: '600' },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  attachmentActive: {
    borderStyle: 'solid',
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentSubtle,
  },
  flowCard: { gap: 2 },
  flowStep: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  flowDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowDotDone: { backgroundColor: colors.accent },
  flowDotText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  flowLine: { width: 2, height: 16, backgroundColor: colors.border, marginLeft: 11 },
});
