import { RouteProp, useRoute } from '@react-navigation/native';
import { Crosshair, Info, MapPin, Save, Trash2 } from 'lucide-react-native';
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
import { colors, radius, spacing } from '../../theme';
import { ACCOUNT_STATUS_LABEL, LOCATION_TYPE_LABEL } from '../../constants';
import type { AccountStatus, LocationType } from '../../types';
import { useAppNavigation, AppParamList } from '../../navigation/types';

export function LocationFormScreen() {
  const route = useRoute<RouteProp<AppParamList, 'LocationForm'>>();
  const navigation = useAppNavigation();
  const user = useSessionUser();
  const { showToast } = useToast();
  const { locations, roles, users, getLocation, saveLocation, deleteLocation } = useApp();

  const editing = getLocation(route.params?.locationId);
  const isEdit = Boolean(editing);

  const [form, setForm] = useState(() => ({
    name: editing?.name ?? '',
    type: (editing?.type ?? 'KANTOR') as LocationType,
    address: editing?.address ?? '',
    latitude: String(editing?.latitude ?? -6.2),
    longitude: String(editing?.longitude ?? 106.816666),
    radiusMeters: String(editing?.radiusMeters ?? 150),
    status: (editing?.status ?? 'ACTIVE') as AccountStatus,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const usedByRoles = roles.filter((role) => role.locationId === editing?.id).length;
  const usedByUsers = users.filter((item) => item.locationId === editing?.id).length;
  const usage = usedByRoles + usedByUsers;

  if (user.role !== 'HRD') {
    return (
      <Screen header={<ScreenHeader title="Form lokasi" onBack={() => navigation.goBack()} />}>
        <AccessDenied
          description="Perubahan master lokasi hanya dapat dilakukan Admin/HRD."
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
    const latitude = Number(form.latitude.replace(',', '.'));
    const longitude = Number(form.longitude.replace(',', '.'));
    const radius = Number(form.radiusMeters.replace(/[^\d]/g, ''));

    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Nama lokasi minimal 3 karakter.';
    if (form.address.trim().length < 5) nextErrors.address = 'Alamat minimal 5 karakter.';
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      nextErrors.latitude = 'Latitude harus antara -90 dan 90.';
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      nextErrors.longitude = 'Longitude harus antara -180 dan 180.';
    }
    if (!Number.isFinite(radius) || radius < 20 || radius > 5000) {
      nextErrors.radiusMeters = 'Radius harus 20–5000 meter.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali data lokasi.', 'error', 'Belum dapat disimpan');
      return;
    }

    const result = saveLocation({
      id: editing?.id,
      name: form.name,
      type: form.type,
      address: form.address,
      latitude,
      longitude,
      radiusMeters: radius,
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
          title={isEdit ? 'Edit lokasi' : 'Lokasi baru'}
          subtitle={isEdit ? `${editing?.name} · ${usage} pemakai` : 'Titik geofencing absensi'}
          onBack={() => navigation.goBack()}
        />
      }
      footer={<Button label={isEdit ? 'Simpan perubahan' : 'Tambah lokasi'} icon={Save} onPress={handleSave} />}
    >
      <Card tone={isEdit ? 'muted' : 'accent'} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <MapPin size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">
              {isEdit ? 'Perubahan lokasi memengaruhi role terkait' : 'Lokasi baru untuk absensi'}
            </AppText>
            <AppText variant="caption" style={{ lineHeight: 16 }}>
              Role dan karyawan yang memakai lokasi ini akan memakai titik & radius terbaru.
            </AppText>
          </View>
        </View>
      </Card>

      <SectionHeader title="Identitas lokasi" />
      <Card style={styles.formCard}>
        <TextField
          label="Nama lokasi"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          placeholder="Contoh: Kantor Pusat Jakarta"
          error={errors.name}
          required
        />
        <SelectField
          label="Tipe lokasi"
          value={form.type}
          options={(Object.keys(LOCATION_TYPE_LABEL) as LocationType[]).map((key) => ({
            value: key,
            label: LOCATION_TYPE_LABEL[key],
          }))}
          onChange={(value) => update('type', value)}
        />
        <TextField
          label="Alamat lengkap"
          value={form.address}
          onChangeText={(value) => update('address', value)}
          placeholder="Jalan, nomor, kota"
          multiline
          numberOfLines={3}
          error={errors.address}
          required
        />
        <SelectField
          label="Status lokasi"
          value={form.status}
          options={(Object.keys(ACCOUNT_STATUS_LABEL) as AccountStatus[]).map((key) => ({
            value: key,
            label: ACCOUNT_STATUS_LABEL[key],
          }))}
          onChange={(value) => update('status', value)}
        />
      </Card>

      <SectionHeader title="Koordinat & radius" subtitle="Dipakai untuk simulasi geofencing" />
      <Card style={styles.formCard}>
        <View style={styles.twoCol}>
          <TextField
            label="Latitude"
            value={form.latitude}
            onChangeText={(value) => update('latitude', value)}
            keyboardType="numbers-and-punctuation"
            error={errors.latitude}
            required
            containerStyle={styles.flex}
          />
          <TextField
            label="Longitude"
            value={form.longitude}
            onChangeText={(value) => update('longitude', value)}
            keyboardType="numbers-and-punctuation"
            error={errors.longitude}
            required
            containerStyle={styles.flex}
          />
        </View>
        <TextField
          label="Radius geofencing (meter)"
          value={form.radiusMeters}
          onChangeText={(value) => update('radiusMeters', value)}
          keyboardType="number-pad"
          prefix="±"
          error={errors.radiusMeters}
          helper="Batas 20–5000 meter. Absensi di luar radius akan ditolak pada simulasi."
          required
        />
        <View style={styles.radiusPreview}>
          <View style={styles.radiusIcon}>
            <Crosshair size={18} color={colors.infoDark} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="smallStrong">Radius simulasi {form.radiusMeters || 0} m</AppText>
            <AppText variant="caption">
              Titik pusat {form.latitude || '—'}, {form.longitude || '—'}
            </AppText>
          </View>
          <Badge label="Simulasi" tone="info" />
        </View>
      </Card>

      <SectionHeader title="Pratinjau" />
      <Card style={styles.formCard}>
        <DetailRow label="Nama" value={form.name || '—'} strong />
        <DetailRow label="Tipe" value={LOCATION_TYPE_LABEL[form.type]} />
        <DetailRow label="Alamat" value={form.address || '—'} multiline />
        <DetailRow label="Radius" value={`${form.radiusMeters || 0} meter`} />
        <DetailRow label="Status" value={ACCOUNT_STATUS_LABEL[form.status]} />
        <Divider />
        <View style={styles.badgeRow}>
          <Badge label={`${usedByRoles} role`} tone={usedByRoles > 0 ? 'info' : 'neutral'} />
          <Badge label={`${usedByUsers} akun`} tone={usedByUsers > 0 ? 'violet' : 'neutral'} />
        </View>
      </Card>

      {isEdit ? (
        <>
          <SectionHeader title="Hapus lokasi" subtitle="Hanya jika tidak dipakai" />
          <Card tone="danger" style={styles.formCard}>
            <AppText variant="small" color={colors.dangerDark} style={{ lineHeight: 17 }}>
              {usage > 0
                ? `Lokasi masih dipakai ${usedByRoles} role dan ${usedByUsers} akun. Pindahkan pengguna ke lokasi lain sebelum menghapus.`
                : 'Lokasi tidak dipakai role atau akun dan dapat dihapus.'}
            </AppText>
            <Button
              label="Hapus lokasi"
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={usage > 0}
              onPress={() => setConfirmDelete(true)}
            />
          </Card>
        </>
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="warning"
        body="Nilai koordinat dan radius hanya dipakai untuk simulasi. Aplikasi belum memanggil GPS asli atau memvalidasi lokasi perangkat."
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus lokasi?"
        message={`Lokasi ${editing?.name ?? ''} akan dihapus dari master data mock.`}
        confirmLabel="Ya, hapus"
        tone="danger"
        onConfirm={() => {
          if (!editing) return;
          const result = deleteLocation(editing.id);
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
  radiusPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  radiusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
