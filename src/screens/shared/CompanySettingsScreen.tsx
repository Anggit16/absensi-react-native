import { Building2, Info, Save, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { SelectField } from '../../components/common/SelectField';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { PAYROLL_RULES } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { parseNumberInput } from '../../utils/format';
import { isValidEmail } from '../../utils/validation';
import { useAppNavigation } from '../../navigation/types';

const TIMEZONES = [
  { value: 'Asia/Jakarta (WIB)', label: 'WIB — Asia/Jakarta', description: 'UTC+7' },
  { value: 'Asia/Makassar (WITA)', label: 'WITA — Asia/Makassar', description: 'UTC+8' },
  { value: 'Asia/Jayapura (WIT)', label: 'WIT — Asia/Jayapura', description: 'UTC+9' },
];

export function CompanySettingsScreen() {
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { company, updateCompany, users, roles, locations } = useApp();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: company.name,
    legalName: company.legalName,
    industry: company.industry,
    address: company.address,
    city: company.city,
    phone: company.phone,
    email: company.email,
    taxId: company.taxId,
    timezone: company.timezone,
    workDaysPerMonth: String(company.workDaysPerMonth),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  if (user.role !== 'OWNER') {
    return (
      <Screen header={<ScreenHeader title="Pengaturan perusahaan" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Pengaturan perusahaan hanya dapat diubah oleh Owner. Hubungi Owner untuk perubahan data perusahaan."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Nama perusahaan minimal 3 karakter.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Format email perusahaan tidak valid.';
    if (form.phone.replace(/\D/g, '').length < 9) nextErrors.phone = 'Nomor telepon minimal 9 digit.';
    const workDays = parseNumberInput(form.workDaysPerMonth);
    if (workDays < 1 || workDays > 31) nextErrors.workDaysPerMonth = 'Hari kerja 1–31.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await updateCompany({
      name: form.name.trim(),
      legalName: form.legalName.trim(),
      industry: form.industry.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      taxId: form.taxId.trim(),
      timezone: form.timezone,
      workDaysPerMonth: workDays,
    });
    showToast(result.message, result.ok ? 'success' : 'error');
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Pengaturan perusahaan"
          subtitle={company.name}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label="Simpan pengaturan" icon={Save} onPress={handleSave} />}
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.logo}>
            <Building2 size={22} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.heroText}>
            <AppText style={styles.heroName}>{company.name}</AppText>
            <AppText style={styles.heroMeta}>
              {company.industry} · sejak {company.establishedYear}
            </AppText>
          </View>
          <Badge label="Tenant aktif" tone="dark" />
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <AppText style={styles.heroStatValue}>{users.filter((item) => item.status === 'ACTIVE').length}</AppText>
            <AppText style={styles.heroStatLabel}>Akun aktif</AppText>
          </View>
          <View style={styles.heroStat}>
            <AppText style={styles.heroStatValue}>{roles.length}</AppText>
            <AppText style={styles.heroStatLabel}>Role kerja</AppText>
          </View>
          <View style={styles.heroStat}>
            <AppText style={styles.heroStatValue}>{locations.length}</AppText>
            <AppText style={styles.heroStatLabel}>Lokasi</AppText>
          </View>
        </View>
      </Card>

      <SectionHeader title="Identitas perusahaan" subtitle="Tampil pada header dan dokumen perusahaan" />
      <Card style={styles.formCard}>
        <TextField label="Nama perusahaan" value={form.name} onChangeText={(value) => update('name', value)} error={errors.name} required />
        <TextField label="Nama legal" value={form.legalName} onChangeText={(value) => update('legalName', value)} />
        <TextField label="Bidang usaha" value={form.industry} onChangeText={(value) => update('industry', value)} />
        <TextField label="NPWP" value={form.taxId} onChangeText={(value) => update('taxId', value)} />
        <TextField
          label="Email perusahaan"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          required
        />
        <TextField
          label="Telepon"
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          keyboardType="phone-pad"
          error={errors.phone}
          required
        />
        <TextField label="Alamat" value={form.address} onChangeText={(value) => update('address', value)} multiline />
        <TextField label="Kota" value={form.city} onChangeText={(value) => update('city', value)} />
      </Card>

      <SectionHeader title="Kebijakan operasional" subtitle="Dipakai sebagai asumsi perhitungan payroll" />
      <Card style={styles.formCard}>
        <TextField
          label="Hari kerja per bulan"
          value={form.workDaysPerMonth}
          onChangeText={(value) => update('workDaysPerMonth', value)}
          keyboardType="number-pad"
          error={errors.workDaysPerMonth}
          helper="Dipakai untuk konversi gaji bulanan ke gaji harian (asumsi perusahaan)."
          required
        />
        <SelectField
          label="Zona waktu"
          value={form.timezone}
          options={TIMEZONES}
          onChange={(value) => update('timezone', value)}
        />
      </Card>

      <SectionHeader title="Aturan rekap payroll" />
      <Card>
        {PAYROLL_RULES.map((rule, index) => (
          <View key={rule} style={styles.rule}>
            <View style={styles.ruleNumber}>
              <AppText style={styles.ruleNumberText}>{index + 1}</AppText>
            </View>
            <AppText variant="small" style={styles.ruleText}>
              {rule}
            </AppText>
          </View>
        ))}
        <Divider />
        <DetailRow label="Karyawan aktif" value={`${users.filter((item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE').length} orang`} icon={Users} />
        <DetailRow label="Akun HRD" value={`${users.filter((item) => item.role === 'HRD').length} akun`} />
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        body="Perubahan perusahaan langsung tersimpan di server dan berlaku untuk seluruh pengguna tenant."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 2 },
  heroName: { fontSize: 16, fontWeight: '700', color: colors.white },
  heroMeta: { fontSize: 11, color: colors.textOnDarkMuted },
  heroStats: { flexDirection: 'row', gap: spacing.sm },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(248,250,252,0.08)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  heroStatValue: { fontSize: 18, fontWeight: '700', color: colors.white },
  heroStatLabel: { fontSize: 10, color: colors.textOnDarkMuted },
  formCard: { gap: spacing.md },
  rule: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  ruleNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  ruleText: { flex: 1, lineHeight: 18, color: colors.textSecondary },
});
