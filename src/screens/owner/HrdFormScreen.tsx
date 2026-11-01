import { RouteProp, useRoute } from '@react-navigation/native';
import { Info, Save, ShieldCheck, UserPlus } from 'lucide-react-native';
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
import { DateField } from '../../components/common/DateField';
import { SectionHeader } from '../../components/common/Section';
import { SelectField } from '../../components/common/SelectField';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { demoHelper, useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { ACCOUNT_STATUS_LABEL, EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { todayISO } from '../../utils/date';
import { isValidEmail } from '../../utils/validation';
import type { AccountStatus, EmploymentType, UserRole } from '../../types';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function HrdFormScreen() {
  const route = useRoute<RouteProp<AppParamList, 'HrdForm'>>();
  const navigation = useAppNavigation();
  const sessionUser = useSessionUser();
  const { showToast } = useToast();
  const { users, getUser, saveUser, getCompensation } = useApp();

  const editing = getUser(route.params?.userId);
  const isEdit = Boolean(editing);
  const compensation = getCompensation(editing?.id);

  const [form, setForm] = useState(() => ({
    name: editing?.name ?? '',
    email: editing?.email ?? '',
    username: editing?.username ?? '',
    password: '',
    phone: editing?.phone ?? '',
    employeeCode:
      editing?.employeeCode ?? `HRD-${String(users.filter((item) => item.role === 'HRD').length + 1).padStart(3, '0')}`,
    employmentType: (editing?.employmentType ?? 'TETAP') as EmploymentType,
    joinDate: editing?.joinDate ?? todayISO(),
    status: (editing?.status ?? 'ACTIVE') as AccountStatus,
    notes: editing?.notes ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (sessionUser.role !== 'OWNER') {
    return (
      <Screen header={<ScreenHeader title="Form HRD" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Hanya Owner yang dapat menambah atau mengubah akun Admin/HRD."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Nama minimal 3 karakter.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Format email tidak valid.';
    if (form.username.trim().length < 4) nextErrors.username = 'Username minimal 4 karakter.';
    if (!isEdit && form.password.length < 6) nextErrors.password = 'Password minimal 6 karakter.';
    if (form.phone.replace(/\D/g, '').length < 9) nextErrors.phone = 'Nomor telepon minimal 9 digit.';
    if (form.employeeCode.trim().length < 3) nextErrors.employeeCode = 'Kode karyawan minimal 3 karakter.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali data akun HRD.', 'error', 'Belum dapat disimpan');
      return;
    }

    const result = saveUser({
      id: editing?.id,
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password || undefined,
      phone: form.phone,
      role: 'HRD' as UserRole,
      employeeCode: form.employeeCode,
      joinDate: form.joinDate,
      employmentType: form.employmentType,
      status: form.status,
      notes: form.notes.trim() || undefined,
    });

    if (result.ok) {
      showToast(result.message, 'success');
      navigation.goBack();
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title={isEdit ? 'Edit akun HRD' : 'Akun HRD baru'}
          subtitle={isEdit ? editing?.email : 'Owner menambahkan akses Admin/HRD'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={isEdit ? 'Simpan perubahan' : 'Tambah akun HRD'}
          icon={isEdit ? Save : UserPlus}
          onPress={handleSave}
        />
      }
    >
      <Card tone="muted" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">Akun Admin / HRD</AppText>
            <AppText variant="caption" style={{ lineHeight: 16 }}>
              Role tetap HRD dengan akses verifikasi pengajuan, master karyawan, dan monitoring absensi.
            </AppText>
          </View>
          <Badge label="HRD" tone="violet" />
        </View>
      </Card>

      <SectionHeader title="Identitas akun" />
      <Card style={styles.formCard}>
        <TextField
          label="Nama lengkap"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          placeholder="Contoh: Sinta Dewi"
          error={errors.name}
          required
        />
        <TextField
          label="Kode karyawan"
          value={form.employeeCode}
          onChangeText={(value) => update('employeeCode', value)}
          autoCapitalize="characters"
          error={errors.employeeCode}
          helper="Kode unik internal untuk administrasi."
          required
        />
        <TextField
          label="Email"
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
      </Card>

      <SectionHeader title="Kredensial" subtitle="Akses login akun HRD" />
      <Card style={styles.formCard}>
        <TextField
          label="Username"
          value={form.username}
          onChangeText={(value) => update('username', value)}
          autoCapitalize="none"
          error={errors.username}
          required
        />
        <TextField
          label={isEdit ? 'Password baru (opsional)' : 'Password awal'}
          value={form.password}
          onChangeText={(value) => update('password', value)}
          secureToggle
          error={errors.password}
          helper={isEdit ? 'Kosongkan jika tidak diubah.' : 'Minimal 6 karakter.'}
          required={!isEdit}
        />
        <SelectField
          label="Status akun"
          value={form.status}
          options={(Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((key) => ({
            value: key,
            label: ACCOUNT_STATUS_LABEL[key],
          }))}
          onChange={(value) => update('status', value)}
          helper="Akun nonaktif tidak bisa login namun riwayat tetap tersimpan."
        />
      </Card>

      <SectionHeader title="Kepegawaian" />
      <Card style={styles.formCard}>
        <SelectField
          label="Status kepegawaian"
          value={form.employmentType}
          options={(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((key) => ({
            value: key,
            label: EMPLOYMENT_TYPE_LABEL[key],
          }))}
          onChange={(value) => update('employmentType', value)}
        />
        <DateField
          label="Tanggal bergabung"
          value={form.joinDate}
          onChange={(value) => update('joinDate', value)}
          maxDate={todayISO()}
          required
        />
        <TextField
          label="Catatan"
          value={form.notes}
          onChangeText={(value) => update('notes', value)}
          placeholder="Catatan internal Owner"
          multiline
          numberOfLines={3}
        />
      </Card>

      {isEdit ? (
        <>
          <SectionHeader title="Komponen gaji" subtitle="Diatur terpisah" />
          <Card style={styles.formCard}>
            <AppText variant="small" color={colors.textSecondary} style={{ lineHeight: 18 }}>
              {compensation
                ? 'Komponen gaji HRD menggunakan skema bulanan tetap. Buka halaman kompensasi untuk mengubah nominal.'
                : 'Akun ini belum memiliki komponen gaji. Lengkapi agar masuk rekap payroll.'}
            </AppText>
            <Button
              label={compensation ? 'Atur komponen gaji' : 'Lengkapi komponen gaji'}
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('HrdCompensation', { userId: editing!.id })}
            />
          </Card>
        </>
      ) : (
        <InfoNote
          style={{ marginTop: spacing.md }}
          icon={Info}
          tone="neutral"
          body="Komponen gaji default HRD baru akan dibuat otomatis (Rp 5.500.000 gaji pokok + tunjangan). Sesuaikan setelah akun dibuat."
        />
      )}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={ShieldCheck}
        tone="warning"
        body={`Password disimpan sebagai teks biasa pada mock state (demo). ${isEdit ? 'Perubahan password langsung berlaku.' : `Kode otomatis berikutnya: ${demoHelper.nextEmployeeCode(users, new Date().getFullYear())}`}`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: { gap: spacing.md },
});
