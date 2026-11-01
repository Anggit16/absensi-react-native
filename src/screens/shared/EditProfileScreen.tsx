import { Info, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { RoleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DateField } from '../../components/common/DateField';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { TextField } from '../../components/common/TextField';
import { useToast } from '../../components/common/Toast';
import { ROLE_LABEL } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { formatDate } from '../../utils/date';
import { isValidEmail } from '../../utils/validation';
import { useAppNavigation } from '../../navigation/types';

export function EditProfileScreen() {
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { updateProfile, getRoleForUser, getLocationForUser } = useApp();
  const { showToast } = useToast();

  const role = getRoleForUser(user);
  const location = getLocationForUser(user);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address ?? '',
    birthDate: user.birthDate ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Nama minimal 3 karakter.';
    if (!isValidEmail(form.email)) nextErrors.email = 'Format email tidak valid.';
    if (form.phone.replace(/\D/g, '').length < 9) nextErrors.phone = 'Nomor telepon minimal 9 digit.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = updateProfile(user.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || undefined,
      birthDate: form.birthDate || undefined,
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
      header={<ScreenHeader title="Edit profil" subtitle={ROLE_LABEL[user.role]} onBack={() => navigation.goBack()} />}
      footer={<Button label="Simpan perubahan" icon={Save} onPress={handleSave} />}
    >
      <Card style={styles.identity}>
        <Avatar name={form.name || user.name} size={58} />
        <View style={styles.identityText}>
          <AppText variant="subtitle">{form.name || user.name}</AppText>
          <AppText variant="caption">
            {role?.name ?? ROLE_LABEL[user.role]} · {user.employeeCode}
          </AppText>
          <RoleBadge role={user.role} />
        </View>
      </Card>

      <SectionHeader title="Data pribadi" subtitle="Perubahan tersimpan pada state mock sesi ini" />
      <Card style={styles.formCard}>
        <TextField label="Nama lengkap" value={form.name} onChangeText={(value) => update('name', value)} error={errors.name} required />
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
          label="Nomor telepon"
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
          maxDate={new Date().toISOString().slice(0, 10)}
        />
        <TextField
          label="Alamat domisili"
          value={form.address}
          onChangeText={(value) => update('address', value)}
          multiline
          placeholder="Jalan, nomor, kota"
        />
      </Card>

      <SectionHeader title="Data kepegawaian" subtitle="Dikelola oleh Admin/HRD" />
      <Card>
        <DetailRow label="Kode karyawan" value={user.employeeCode} />
        <DetailRow label="Role kerja" value={role?.name ?? ROLE_LABEL[user.role]} />
        <DetailRow label="Lokasi kerja" value={location?.name ?? '-'} />
        <DetailRow label="Tanggal bergabung" value={formatDate(user.joinDate)} />
        <Divider />
        <DetailRow label="Username" value={user.username} />
      </Card>

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        body="Perubahan password, email verifikasi, dan foto profil belum tersedia pada fase frontend ini."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 3, alignItems: 'flex-start' },
  formCard: { gap: spacing.md },
});
