import { RouteProp, useRoute } from '@react-navigation/native';
import { BadgeDollarSign, Info, Save, ShieldCheck, Wallet } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { currentPeriod, formatDateTime } from '../../utils/date';
import { formatNumber, parseNumberInput } from '../../utils/format';
import type { HrdCompensation } from '../../types';
import { useAppNavigation, AppParamList } from '../../navigation/types';

const FIELDS: {
  key: keyof Omit<HrdCompensation, 'userId' | 'updatedAt'>;
  label: string;
  helper: string;
  deduction?: boolean;
}[] = [
  {
    key: 'baseSalary',
    label: 'Gaji pokok',
    helper: 'Nominal bulanan tetap sebelum tunjangan.',
  },
  {
    key: 'positionAllowance',
    label: 'Tunjangan jabatan',
    helper: 'Tunjangan tetap yang melekat pada posisi Admin/HRD.',
  },
  {
    key: 'transportAllowance',
    label: 'Tunjangan transport',
    helper: 'Nominal bulanan penuh, tidak dihitung per hari hadir.',
  },
  {
    key: 'mealAllowance',
    label: 'Tunjangan makan',
    helper: 'Nominal bulanan penuh untuk komponen gaji HRD.',
  },
  {
    key: 'bpjsDeduction',
    label: 'Potongan BPJS',
    helper: 'Potongan yang dikurangkan dari take home pay.',
    deduction: true,
  },
];

export function HrdCompensationScreen() {
  const route = useRoute<RouteProp<AppParamList, 'HrdCompensation'>>();
  const navigation = useAppNavigation();
  const sessionUser = useSessionUser();
  const { showToast } = useToast();
  const { getUser, getCompensation, updateHrdCompensation, company } = useApp();

  const hrd = getUser(route.params.userId);
  const compensation = getCompensation(hrd?.id);

  const [form, setForm] = useState(() => ({
    baseSalary: String(compensation?.baseSalary ?? 0),
    positionAllowance: String(compensation?.positionAllowance ?? 0),
    transportAllowance: String(compensation?.transportAllowance ?? 0),
    mealAllowance: String(compensation?.mealAllowance ?? 0),
    bpjsDeduction: String(compensation?.bpjsDeduction ?? 0),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numbers = useMemo(
    () => ({
      baseSalary: parseNumberInput(form.baseSalary),
      positionAllowance: parseNumberInput(form.positionAllowance),
      transportAllowance: parseNumberInput(form.transportAllowance),
      mealAllowance: parseNumberInput(form.mealAllowance),
      bpjsDeduction: parseNumberInput(form.bpjsDeduction),
    }),
    [form],
  );

  const earnings =
    numbers.baseSalary + numbers.positionAllowance + numbers.transportAllowance + numbers.mealAllowance;
  const takeHome = Math.max(0, earnings - numbers.bpjsDeduction);

  if (sessionUser.role !== 'OWNER') {
    return (
      <Screen header={<ScreenHeader title="Komponen gaji HRD" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Komponen gaji Admin/HRD hanya dapat diatur oleh Owner."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  if (!hrd) {
    return (
      <Screen header={<ScreenHeader title="Komponen gaji HRD" onBack={() => navigation.goBack()} />}>
        <EmptyState
          icon={Wallet}
          title="Akun HRD tidak ditemukan"
          description="Data mungkin sudah dihapus dari server."
        />
      </Screen>
    );
  }

  const update = (key: keyof typeof form, value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setForm((previous) => ({ ...previous, [key]: digits ? formatNumber(Number(digits)) : '' }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (numbers.baseSalary <= 0) nextErrors.baseSalary = 'Gaji pokok harus lebih dari 0.';
    if (numbers.baseSalary > 500_000_000) nextErrors.baseSalary = 'Nominal melebihi batas wajar.';
    if (numbers.bpjsDeduction > earnings) {
      nextErrors.bpjsDeduction = 'Potongan tidak boleh melebihi total pendapatan.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali komponen gaji HRD.', 'error', 'Belum dapat disimpan');
      return;
    }

    const result = await updateHrdCompensation(hrd.id, numbers);
    showToast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) navigation.goBack();
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Komponen gaji"
          subtitle={`${hrd.name} · ${hrd.employeeCode}`}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label="Simpan komponen gaji" icon={Save} onPress={handleSave} />}
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>TAKE HOME / BULAN</AppText>
            <AppText style={styles.heroValue}>Rp {formatNumber(takeHome)}</AppText>
            <AppText style={styles.heroHint}>
              Pendapatan Rp {formatNumber(earnings)} − potongan BPJS Rp {formatNumber(numbers.bpjsDeduction)}
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <BadgeDollarSign size={24} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <AppText style={styles.heroChipLabel}>Gaji pokok</AppText>
            <AppText style={styles.heroChipValue}>Rp {formatNumber(numbers.baseSalary)}</AppText>
          </View>
          <View style={styles.heroChip}>
            <AppText style={styles.heroChipLabel}>Tunjangan</AppText>
            <AppText style={styles.heroChipValue}>
              Rp{' '}
              {formatNumber(
                numbers.positionAllowance + numbers.transportAllowance + numbers.mealAllowance,
              )}
            </AppText>
          </View>
        </View>
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        title="Skema khusus Admin/HRD"
        body="Gaji HRD memakai skema bulanan tetap: tidak memakai absensi harian, denda keterlambatan, atau potongan cuti. Komponen ini tampil pada rekap payroll Owner dan HRD."
      />

      <SectionHeader title="Pendapatan" subtitle="Nominal bulanan tetap" />
      <Card style={styles.formCard}>
        {FIELDS.filter((field) => !field.deduction).map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            value={form[field.key]}
            onChangeText={(value) => update(field.key, value)}
            keyboardType="number-pad"
            prefix="Rp"
            placeholder="0"
            helper={field.helper}
            error={errors[field.key]}
            required
          />
        ))}
      </Card>

      <SectionHeader title="Potongan" subtitle="Dikurangkan dari pendapatan bruto" />
      <Card style={styles.formCard}>
        {FIELDS.filter((field) => field.deduction).map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            value={form[field.key]}
            onChangeText={(value) => update(field.key, value)}
            keyboardType="number-pad"
            prefix="Rp"
            placeholder="0"
            helper={field.helper}
            error={errors[field.key]}
          />
        ))}
        <View style={styles.deductionRow}>
          <AppText variant="smallStrong">Total potongan</AppText>
          <AppText variant="bodyStrong" color={colors.dangerDark}>
            Rp {formatNumber(numbers.bpjsDeduction)}
          </AppText>
        </View>
      </Card>

      <SectionHeader title="Ringkasan payroll" subtitle={`Periode ${currentPeriod()}`} />
      <Card style={styles.formCard}>
        {compensation ? (
          <PayrollPreview
            rows={[
              ['Gaji pokok', numbers.baseSalary],
              ['Tunjangan jabatan', numbers.positionAllowance],
              ['Tunjangan transport', numbers.transportAllowance],
              ['Tunjangan makan', numbers.mealAllowance],
              ['Potongan BPJS', -numbers.bpjsDeduction],
            ]}
            total={takeHome}
            workDays={company.workDaysPerMonth}
            dailyBase={Math.round(numbers.baseSalary / Math.max(1, company.workDaysPerMonth))}
          />
        ) : (
          <AppText variant="small" style={{ lineHeight: 18 }}>
            Belum ada komponen gaji tersimpan. Isi formulir di atas lalu simpan agar akun ini masuk
            rekap payroll dengan nilai Rp {formatNumber(takeHome)}.
          </AppText>
        )}
        {compensation ? (
          <AppText variant="caption">Terakhir diperbarui {formatDateTime(compensation.updatedAt)}</AppText>
        ) : null}
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ShieldCheck}
        tone="warning"
        body="Perubahan komponen gaji langsung memengaruhi rekap payroll periode berjalan di server. Tidak ada proses penggajian atau transfer dana nyata."
      />
    </Screen>
  );
}

function PayrollPreview({
  rows,
  total,
  workDays,
  dailyBase,
}: {
  rows: [string, number][];
  total: number;
  workDays: number;
  dailyBase: number;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      {rows.map(([label, value]) => (
        <DetailRow
          key={label}
          label={label}
          value={value < 0 ? `− Rp ${formatNumber(Math.abs(value))}` : `Rp ${formatNumber(value)}`}
          valueColor={value < 0 ? colors.dangerDark : colors.text}
        />
      ))}
      <Divider />
      <DetailRow label="Take home" value={`Rp ${formatNumber(total)}`} strong />
      <DetailRow label="Hari kerja acuan" value={`${workDays} hari`} />
      <DetailRow label="Gaji pokok harian (acuan)" value={`Rp ${formatNumber(dailyBase)}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, lineHeight: 16, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroChips: { flexDirection: 'row', gap: spacing.sm },
  heroChip: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: spacing.md,
    gap: 2,
  },
  heroChipLabel: { fontSize: 10.5, color: colors.textOnDarkMuted, fontWeight: '600' },
  heroChipValue: { fontSize: 14, color: colors.white, fontWeight: '700' },
  formCard: { gap: spacing.md },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
