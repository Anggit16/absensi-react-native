import { RouteProp, useRoute } from '@react-navigation/native';
import { Info, Save, UserPlus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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
import { useApp, useSessionUser , formHelper } from '../../store/AppProvider';
import { spacing } from '../../theme';
import { ACCOUNT_STATUS_LABEL, EMPLOYMENT_TYPE_LABEL } from '../../constants';
import { addDays, todayISO } from '../../utils/date';
import { isValidEmail } from '../../utils/validation';
import type { AccountStatus, EmploymentType, UserRole } from '../../types';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function EmployeeFormScreen() {
  const route = useRoute<RouteProp<AppParamList, 'EmployeeForm'>>();
  const navigation = useAppNavigation();
  const sessionUser = useSessionUser();
  const { showToast } = useToast();
  const { users, roles, locations, getUser, saveUser } = useApp();

  const editing = getUser(route.params?.userId);
  const isEdit = Boolean(editing);

  const defaultRole = useMemo(
    () => roles.find((role) => role.status === 'ACTIVE') ?? roles[0],
    [roles],
  );

  const [form, setForm] = useState(() => ({
    name: editing?.name ?? '',
    email: editing?.email ?? '',
    username: editing?.username ?? '',
    password: '',
    phone: editing?.phone ?? '',
    employeeCode:
      editing?.employeeCode ??
      formHelper.nextEmployeeCode(users, new Date().getFullYear()),
    jobRoleId: editing?.jobRoleId ?? defaultRole?.id ?? '',
    locationId: editing?.locationId ?? defaultRole?.locationId ?? locations[0]?.id ?? '',
    employmentType: (editing?.employmentType ?? 'TETAP') as EmploymentType,
    joinDate: editing?.joinDate ?? addDays(todayISO(), 0),
    birthDate: editing?.birthDate ?? '',
    address: editing?.address ?? '',
    emergencyContact: editing?.emergencyContact ?? '',
    status: (editing?.status ?? 'ACTIVE') as AccountStatus,
    notes: editing?.notes ?? '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (sessionUser.role !== 'HRD') {
    return (
      <Screen header={<ScreenHeader title="Form karyawan" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Hanya Admin/HRD yang dapat menambah atau mengubah data karyawan."
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

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Nama minimal 3 karakter.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Format email tidak valid.';
    if (form.username.trim().length < 4) nextErrors.username = 'Username minimal 4 karakter.';
    if (!isEdit && form.password.length < 6) nextErrors.password = 'Password minimal 6 karakter.';
    if (form.phone.replace(/\D/g, '').length < 9) nextErrors.phone = 'Nomor telepon minimal 9 digit.';
    if (form.employeeCode.trim().length < 3) nextErrors.employeeCode = 'Kode karyawan minimal 3 karakter.';
    if (!form.jobRoleId) nextErrors.jobRoleId = 'Role kerja wajib dipilih.';
    if (!form.joinDate) nextErrors.joinDate = 'Tanggal bergabung wajib diisi.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali data karyawan.', 'error', 'Belum dapat disimpan');
      return;
    }

    const result = await saveUser({
      id: editing?.id,
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password || undefined,
      phone: form.phone,
      role: 'EMPLOYEE' as UserRole,
      employeeCode: form.employeeCode,
      jobRoleId: form.jobRoleId,
      locationId: form.locationId,
      joinDate: form.joinDate,
      employmentType: form.employmentType,
      status: form.status,
      address: form.address.trim() || undefined,
      birthDate: form.birthDate || undefined,
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
          title={isEdit ? 'Edit karyawan' : 'Karyawan baru'}
          subtitle={isEdit ? editing?.employeeCode : 'Tambahkan akun karyawan'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <Button
          label={isEdit ? 'Simpan perubahan' : 'Tambah karyawan'}
          icon={isEdit ? Save : UserPlus}
          onPress={handleSave}
        />
      }
    >
      <Card tone={isEdit ? 'muted' : 'accent'} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">
              {isEdit ? `Mengubah data ${editing?.name}` : 'Akun karyawan baru'}
            </AppText>
            <AppText variant="caption" style={{ lineHeight: 16 }}>
              {isEdit
                ? 'Perubahan langsung berlaku di server dan tampilan terkait.'
                : 'Saldo cuti otomatis dibuat sesuai kuota role yang dipilih.'}
            </AppText>
          </View>
          <Badge label={isEdit ? 'Edit' : 'Baru'} tone={isEdit ? 'neutral' : 'success'} />
        </View>
      </Card>

      <SectionHeader title="Identitas" subtitle="Data utama karyawan" />
      <Card style={styles.formCard}>
        <TextField
          label="Nama lengkap"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          placeholder="Contoh: Andi Pratama"
          error={errors.name}
          required
        />
        <TextField
          label="Kode karyawan"
          value={form.employeeCode}
          onChangeText={(value) => update('employeeCode', value)}
          autoCapitalize="characters"
          error={errors.employeeCode}
          helper="Dipakai pada absensi, payroll, dan surat."
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
        <DateField
          label="Tanggal lahir"
          value={form.birthDate}
          onChange={(value) => update('birthDate', value)}
          maxDate={todayISO()}
          placeholder="Opsional"
        />
      </Card>

      <SectionHeader title="Akun & akses" subtitle="Kredensial login karyawan" />
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
          helper={isEdit ? 'Biarkan kosong bila tidak ingin mengubah password.' : 'Minimal 6 karakter.'}
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
          helper="Akun nonaktif tidak dapat login dan tidak masuk payroll aktif."
        />
      </Card>

      <SectionHeader title="Penempatan kerja" subtitle="Role menentukan jam kerja & komponen gaji" />
      <Card style={styles.formCard}>
        <SelectField
          label="Role kerja"
          value={form.jobRoleId}
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
            description: `${role.department} · ${role.checkInTime}–${role.checkOutTime} · kuota ${role.annualLeaveQuota} hari`,
          }))}
          onChange={(value) => {
            const role = roles.find((item) => item.id === value);
            setForm((previous) => ({
              ...previous,
              jobRoleId: value,
              locationId: role?.locationId ?? previous.locationId,
            }));
          }}
          error={errors.jobRoleId}
          required
        />
        <SelectField
          label="Lokasi kerja"
          value={form.locationId}
          options={locations.map((location) => ({
            value: location.id,
            label: location.name,
            description: `Radius ${location.radiusMeters} m · ${location.type}`,
          }))}
          onChange={(value) => update('locationId', value)}
          helper="Menentukan titik geofencing default untuk absensi."
        />
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
          error={errors.joinDate}
          required
        />
      </Card>

      <SectionHeader title="Data tambahan" subtitle="Opsional, untuk profil karyawan" />
      <Card style={styles.formCard}>
        <TextField
          label="Alamat"
          value={form.address}
          onChangeText={(value) => update('address', value)}
          placeholder="Alamat domisili"
          multiline
          numberOfLines={3}
        />
        <TextField
          label="Kontak darurat"
          value={form.emergencyContact}
          onChangeText={(value) => update('emergencyContact', value)}
          placeholder="Nama — nomor telepon"
        />
        <TextField
          label="Catatan HRD"
          value={form.notes}
          onChangeText={(value) => update('notes', value)}
          placeholder="Catatan internal (tidak tampil ke karyawan)"
          multiline
          numberOfLines={3}
        />
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        body="Data karyawan disimpan di server. Password di-hash dan tidak ditampilkan kembali."
      />
      <View style={styles.previewRow}>
        <AppText variant="caption">Pratinjau email login</AppText>
        <AppText variant="smallStrong">{form.email || '—'}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  formCard: { gap: spacing.md },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
