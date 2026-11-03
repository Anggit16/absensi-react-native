import { RouteProp, useRoute } from '@react-navigation/native';
import { Clock3, Info, Save, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { SelectField } from '../../components/common/SelectField';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { ACCOUNT_STATUS_LABEL, SALARY_BASIS_LABEL } from '../../constants';
import { formatCurrency, parseNumberInput } from '../../utils/format';
import { isValidTime } from '../../utils/validation';
import { timeToMinutes } from '../../utils/date';
import type { AccountStatus, SalaryBasis } from '../../types';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function RoleFormScreen() {
  const route = useRoute<RouteProp<AppParamList, 'RoleForm'>>();
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { showToast } = useToast();
  const { locations, users, getRole, saveRole, deleteRole } = useApp();

  const editing = getRole(route.params?.roleId);
  const isEdit = Boolean(editing);
  const usedBy = users.filter((item) => item.jobRoleId === editing?.id).length;

  const [form, setForm] = useState(() => ({
    name: editing?.name ?? '',
    department: editing?.department ?? '',
    checkInTime: editing?.checkInTime ?? '08:00',
    checkOutTime: editing?.checkOutTime ?? '17:00',
    lateToleranceMinutes: String(editing?.lateToleranceMinutes ?? 15),
    salaryBasis: (editing?.salaryBasis ?? 'BULANAN') as SalaryBasis,
    baseSalary: String(editing?.baseSalary ?? 5000000),
    transportAllowance: String(editing?.transportAllowance ?? 25000),
    mealAllowance: String(editing?.mealAllowance ?? 20000),
    latePenaltyPerMinute: String(editing?.latePenaltyPerMinute ?? 1000),
    annualLeaveQuota: String(editing?.annualLeaveQuota ?? 12),
    locationId: editing?.locationId ?? locations[0]?.id ?? '',
    status: (editing?.status ?? 'ACTIVE') as AccountStatus,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (user.role !== 'HRD') {
    return (
      <Screen header={<ScreenHeader title="Form role" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Perubahan master role hanya dapat dilakukan Admin/HRD."
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
    if (form.name.trim().length < 3) nextErrors.name = 'Nama role minimal 3 karakter.';
    if (!isValidTime(form.checkInTime)) nextErrors.checkInTime = 'Format jam masuk HH:mm (contoh 08:00).';
    if (!isValidTime(form.checkOutTime)) nextErrors.checkOutTime = 'Format jam pulang HH:mm (contoh 17:00).';
    if (
      isValidTime(form.checkInTime) &&
      isValidTime(form.checkOutTime) &&
      timeToMinutes(form.checkOutTime) <= timeToMinutes(form.checkInTime)
    ) {
      nextErrors.checkOutTime = 'Jam pulang harus lebih besar dari jam masuk.';
    }
    if (parseNumberInput(form.baseSalary) <= 0) nextErrors.baseSalary = 'Gaji pokok harus lebih dari 0.';
    if (!form.locationId) nextErrors.locationId = 'Lokasi kerja wajib dipilih.';
    if (parseNumberInput(form.annualLeaveQuota) < 0) nextErrors.annualLeaveQuota = 'Kuota cuti tidak boleh negatif.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali pengaturan role.', 'error', 'Belum dapat disimpan');
      return;
    }

    const result = await saveRole({
      id: editing?.id,
      name: form.name,
      department: form.department,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      lateToleranceMinutes: parseNumberInput(form.lateToleranceMinutes),
      salaryBasis: form.salaryBasis,
      baseSalary: parseNumberInput(form.baseSalary),
      transportAllowance: parseNumberInput(form.transportAllowance),
      mealAllowance: parseNumberInput(form.mealAllowance),
      latePenaltyPerMinute: parseNumberInput(form.latePenaltyPerMinute),
      annualLeaveQuota: parseNumberInput(form.annualLeaveQuota),
      locationId: form.locationId,
      status: form.status,
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
          title={isEdit ? 'Edit role' : 'Role baru'}
          subtitle={isEdit ? `${editing?.name} · ${usedBy} karyawan` : 'Atur jam kerja & komponen gaji'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label={isEdit ? 'Simpan perubahan' : 'Buat role'} icon={Save} onPress={handleSave} />}
    >
      <Card tone={isEdit ? 'muted' : 'accent'} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Clock3 size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">
              {isEdit ? 'Perubahan berlaku untuk semua karyawan dengan role ini' : 'Role baru untuk master data'}
            </AppText>
            <AppText variant="caption" style={{ lineHeight: 16 }}>
              Jam kerja menentukan status tepat waktu/terlambat. Komponen gaji dipakai pada rekap rekap payroll.
            </AppText>
          </View>
        </View>
      </Card>

      <SectionHeader title="Identitas role" />
      <Card style={styles.formCard}>
        <TextField
          label="Nama role"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          placeholder="Contoh: Software Engineer"
          error={errors.name}
          required
        />
        <TextField
          label="Departemen"
          value={form.department}
          onChangeText={(value) => update('department', value)}
          placeholder="Contoh: Technology"
          required
        />
        <SelectField
          label="Lokasi kerja default"
          value={form.locationId}
          options={locations.map((location) => ({
            value: location.id,
            label: location.name,
            description: `Radius ${location.radiusMeters} m`,
          }))}
          onChange={(value) => update('locationId', value)}
          error={errors.locationId}
          required
        />
        <SelectField
          label="Status role"
          value={form.status}
          options={(Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((key) => ({
            value: key,
            label: ACCOUNT_STATUS_LABEL[key],
          }))}
          onChange={(value) => update('status', value)}
        />
      </Card>

      <SectionHeader title="Jam kerja" subtitle="Format 24 jam HH:mm" />
      <Card style={styles.formCard}>
        <View style={styles.twoCol}>
          <TextField
            label="Jam masuk"
            value={form.checkInTime}
            onChangeText={(value) => update('checkInTime', value)}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            error={errors.checkInTime}
            required
            containerStyle={styles.flex}
          />
          <TextField
            label="Jam pulang"
            value={form.checkOutTime}
            onChangeText={(value) => update('checkOutTime', value)}
            placeholder="17:00"
            keyboardType="numbers-and-punctuation"
            error={errors.checkOutTime}
            required
            containerStyle={styles.flex}
          />
        </View>
        <TextField
          label="Toleransi keterlambatan (menit)"
          value={form.lateToleranceMinutes}
          onChangeText={(value) => update('lateToleranceMinutes', value)}
          keyboardType="number-pad"
          helper="Absen setelah jam masuk + toleransi dihitung terlambat."
        />
      </Card>

      <SectionHeader title="Komponen gaji" subtitle="Dasar perhitungan payroll" />
      <Card style={styles.formCard}>
        <SelectField
          label="Basis gaji"
          value={form.salaryBasis}
          options={(Object.keys(SALARY_BASIS_LABEL) as SalaryBasis[]).map((key) => ({
            value: key,
            label: SALARY_BASIS_LABEL[key],
            description: key === 'BULANAN' ? 'Dikonversi ke harian memakai hari kerja perusahaan' : 'Nominal per hari hadir',
          }))}
          onChange={(value) => update('salaryBasis', value)}
        />
        <TextField
          label={form.salaryBasis === 'BULANAN' ? 'Gaji pokok bulanan' : 'Gaji pokok harian'}
          value={form.baseSalary}
          onChangeText={(value) => update('baseSalary', value)}
          keyboardType="number-pad"
          prefix="Rp"
          error={errors.baseSalary}
          helper={`Pratinjau: ${formatCurrency(parseNumberInput(form.baseSalary))}`}
          required
        />
        <TextField
          label="Tunjangan transportasi / hari"
          value={form.transportAllowance}
          onChangeText={(value) => update('transportAllowance', value)}
          keyboardType="number-pad"
          prefix="Rp"
        />
        <TextField
          label="Tunjangan makan / hari"
          value={form.mealAllowance}
          onChangeText={(value) => update('mealAllowance', value)}
          keyboardType="number-pad"
          prefix="Rp"
        />
        <TextField
          label="Denda keterlambatan / menit"
          value={form.latePenaltyPerMinute}
          onChangeText={(value) => update('latePenaltyPerMinute', value)}
          keyboardType="number-pad"
          prefix="Rp"
          helper="Dikalikan total menit terlambat pada payroll."
        />
        <TextField
          label="Kuota cuti tahunan (hari)"
          value={form.annualLeaveQuota}
          onChangeText={(value) => update('annualLeaveQuota', value)}
          keyboardType="number-pad"
          error={errors.annualLeaveQuota}
          helper="Dipakai saat membuat saldo cuti karyawan baru."
        />
      </Card>

      <SectionHeader title="Pratinjau" />
      <Card style={styles.formCard}>
        <DetailRow label="Jam kerja" value={`${form.checkInTime}–${form.checkOutTime}`} />
        <DetailRow
          label="Gaji pokok"
          value={formatCurrency(parseNumberInput(form.baseSalary))}
          strong
        />
        <DetailRow
          label="Tunjangan harian"
          value={formatCurrency(
            parseNumberInput(form.transportAllowance) + parseNumberInput(form.mealAllowance),
          )}
        />
        <DetailRow
          label="Denda per menit"
          value={formatCurrency(parseNumberInput(form.latePenaltyPerMinute))}
        />
        <Divider />
        <View style={styles.badgeRow}>
          <Badge label={`${usedBy} karyawan`} tone={usedBy > 0 ? 'info' : 'neutral'} />
          <Badge label={`${form.annualLeaveQuota || 0} hari cuti`} tone="violet" />
          <Badge label={form.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'} tone={form.status === 'ACTIVE' ? 'success' : 'neutral'} />
        </View>
      </Card>

      {isEdit ? (
        <>
          <SectionHeader title="Hapus role" subtitle="Hanya jika tidak dipakai karyawan" />
          <Card tone="danger" style={styles.formCard}>
            <AppText variant="small" color={colors.dangerDark} style={{ lineHeight: 17 }}>
              {usedBy > 0
                ? `Role ini dipakai ${usedBy} karyawan. Pindahkan karyawan ke role lain sebelum menghapus.`
                : 'Role tidak dipakai karyawan dan dapat dihapus dari master data.'}
            </AppText>
            <Button
              label="Hapus role"
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={usedBy > 0}
              onPress={() => setConfirmDelete(true)}
            />
          </Card>
        </>
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        body="Perubahan role tidak mengubah riwayat absensi yang sudah tercatat, namun memengaruhi perhitungan payroll periode berjalan."
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus role?"
        message={`Role ${editing?.name ?? ''} akan dihapus permanen dari server.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        onConfirm={async () => {
          if (!editing) return;
          const result = await deleteRole(editing.id);
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
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
