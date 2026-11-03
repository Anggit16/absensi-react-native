import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Timer,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge, AttendanceStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { useToast } from '../../components/common/Toast';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDateLong, formatTimeFromISO, nowTime, todayISO } from '../../utils/date';
import { distanceMeters } from '../../utils/geo';
import { useAppNavigation } from '../../navigation/types';

type LocationStatus = 'loading' | 'ready' | 'denied' | 'error';

interface DeviceCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  mocked: boolean;
}

interface SelfieFile {
  uri: string;
  name: string;
  type: string;
}

export function AttendanceScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { showToast } = useToast();
  const { attendances, checkAttendance, getRoleForUser, getLocationForUser, company } = useApp();

  const role = getRoleForUser(user);
  const location = getLocationForUser(user);
  const today = todayISO();

  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [locationMessage, setLocationMessage] = useState('');
  const [selfie, setSelfie] = useState<SelfieFile | null>(null);
  const [selfieAt, setSelfieAt] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const record = attendances.find(
    (item) => item.userId === user.id && item.date === today,
  );

  const refreshLocation = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      setLocationMessage('');

      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        setLocationMessage(
          'Izin lokasi ditolak. Aktifkan izin lokasi AbsensiPro di pengaturan perangkat untuk melakukan absensi.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        mocked: position.mocked === true,
      });
      setLocationStatus('ready');
    } catch (error) {
      setCoords(null);
      setLocationStatus('error');
      setLocationMessage(
        error instanceof Error
          ? `Gagal membaca lokasi: ${error.message}`
          : 'Gagal membaca lokasi perangkat.',
      );
    }
  }, [setCoords, setLocationMessage, setLocationStatus]);

  useEffect(() => {
    // Pemuatan awal lokasi adalah sinkronisasi dengan GPS perangkat, bukan cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshLocation();
  }, [refreshLocation]);

  const distance = useMemo(() => {
    if (!coords || !location) return null;

    return distanceMeters(coords, {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }, [coords, location]);

  const withinRadius = distance !== null && location ? distance <= location.radiusMeters : false;
  const isMocked = coords?.mocked === true;
  const mode: 'CHECK_IN' | 'CHECK_OUT' = record?.checkInAt ? 'CHECK_OUT' : 'CHECK_IN';
  const alreadyDone = mode === 'CHECK_OUT' && !!record?.checkOutAt;
  const gpsValid = locationStatus === 'ready' && !!coords && !isMocked;

  const canSubmit =
    !!location && gpsValid && withinRadius && !!selfie && !alreadyDone && !isSubmitting;

  const takeSelfie = async () => {
    setIsCapturing(true);

    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          showToast(
            'Izin kamera diperlukan untuk selfie absensi.',
            'error',
            'Kamera tidak diizinkan',
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front,
        quality: 0.6,
        allowsEditing: false,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];

      setSelfie({
        uri: asset.uri,
        name: asset.fileName ?? `selfie-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      setSelfieAt(nowTime());
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Kamera gagal dibuka.',
        'error',
        'Gagal mengambil selfie',
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const submit = async () => {
    if (!location || !coords || distance === null || !selfie) {
      showToast('Lengkapi lokasi dan selfie terlebih dahulu.', 'error');
      setConfirmMode(null);
      return;
    }

    setIsSubmitting(true);

    const result = await checkAttendance({
      userId: user.id,
      mode,
      locationId: location.id,
      locationName: location.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      distanceMeters: distance,
      withinRadius,
      selfieCaptured: true,
      selfie,
    });

    setIsSubmitting(false);
    setConfirmMode(null);

    if (result.ok) {
      setSelfie(null);
      setSelfieAt(null);
      showToast(
        result.message,
        'success',
        mode === 'CHECK_IN' ? 'Absen masuk berhasil' : 'Absen pulang berhasil',
      );
    } else {
      showToast(result.message, 'error');
    }
  };

  const gpsTone = isMocked || locationStatus === 'denied' || locationStatus === 'error'
    ? 'danger'
    : withinRadius
      ? 'success'
      : 'warning';

  return (
    <Screen
      header={
        <ScreenHeader
          title="Absensi"
          eyebrow={company.name}
          subtitle={formatDateLong(today)}
          onMenu={() => navigation.navigate('Menu')}
        />
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <AppText style={styles.heroEyebrow}>WAKTU PERANGKAT</AppText>
            <AppText style={styles.heroTime}>{nowTime()}</AppText>
            <AppText style={styles.heroHint}>
              {mode === 'CHECK_IN'
                ? `Jadwal masuk ${role?.checkInTime ?? '—'} · toleransi ${role?.lateToleranceMinutes ?? 0} menit`
                : `Jadwal pulang ${role?.checkOutTime ?? '—'}`}
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <ScanFace size={24} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
        <View style={styles.heroStatusRow}>
          <View style={styles.heroStatusItem}>
            <AppText style={styles.heroStatusLabel}>Masuk</AppText>
            <AppText style={styles.heroStatusValue}>{record?.checkInAt ?? '—'}</AppText>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatusItem}>
            <AppText style={styles.heroStatusLabel}>Pulang</AppText>
            <AppText style={styles.heroStatusValue}>{record?.checkOutAt ?? '—'}</AppText>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatusItem}>
            <AppText style={styles.heroStatusLabel}>Status</AppText>
            <AppText style={styles.heroStatusValue}>
              {record ? (record.status === 'LATE' ? `Telat ${record.lateMinutes}m` : 'Tepat waktu') : 'Belum absen'}
            </AppText>
          </View>
        </View>
      </Card>

      {record ? (
        <Card style={styles.todayCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">Catatan absensi hari ini</AppText>
              <AppText variant="caption">
                {record.locationName ?? 'Lokasi tidak tercatat'}
                {record.distanceMeters !== undefined ? ` · ${record.distanceMeters} m dari titik kantor` : ''}
              </AppText>
            </View>
            <AttendanceStatusBadge status={record.status} />
          </View>
          {record.selfieCaptured || record.checkOutSelfieCaptured ? (
            <View style={styles.selfieStored}>
              <ShieldCheck size={13} color={colors.accentDark} strokeWidth={2.2} />
              <AppText variant="caption" style={{ color: colors.accentDark }}>
                Selfie absensi tersimpan di server (bukan biometrik)
              </AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      <SectionHeader
        title="1. Lokasi & geofence"
        subtitle="Koordinat dibaca dari GPS perangkat, lalu divalidasi ulang di server"
      />
      <Card style={styles.sectionCard}>
        <View style={styles.assigned}>
          <View style={styles.assignedIcon}>
            <MapPin size={16} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="smallStrong">
              {location?.name ?? 'Lokasi kerja belum diatur'}
            </AppText>
            <AppText variant="caption">
              {location
                ? `${location.address} · radius ${location.radiusMeters} m`
                : 'Hubungi Admin/HRD untuk menetapkan lokasi kerja Anda.'}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.gpsBox,
            {
              backgroundColor:
                gpsTone === 'success'
                  ? colors.accentSubtle
                  : gpsTone === 'warning'
                    ? colors.warningSoft
                    : colors.dangerSoft,
              borderColor:
                gpsTone === 'success'
                  ? colors.accentSoft
                  : gpsTone === 'warning'
                    ? '#FDE68A'
                    : '#FECACA',
            },
          ]}
        >
          <View style={styles.gpsHeader}>
            <View style={styles.gpsIcon}>
              <Navigation
                size={17}
                color={gpsTone === 'success' ? colors.accentDark : colors.dangerDark}
                strokeWidth={2.2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText
                variant="smallStrong"
                color={gpsTone === 'success' ? colors.accentDark : colors.dangerDark}
              >
                {locationStatus === 'loading'
                  ? 'Membaca lokasi perangkat…'
                  : locationStatus === 'denied'
                    ? 'Izin lokasi belum diberikan'
                    : locationStatus === 'error'
                      ? 'Lokasi tidak tersedia'
                      : isMocked
                        ? 'Mock location terdeteksi'
                        : withinRadius
                          ? 'Dalam radius geofencing'
                          : 'Di luar radius geofencing'}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: gpsTone === 'success' ? colors.accentDark : colors.dangerDark }}
              >
                {locationStatus === 'ready' && distance !== null
                  ? `Jarak GPS ${distance} m · batas ${location?.radiusMeters ?? 0} m`
                  : (locationMessage || 'Menunggu koordinat GPS…')}
              </AppText>
            </View>
            <Badge
              label={
                locationStatus === 'loading'
                  ? 'Memuat'
                  : locationStatus === 'ready' && !isMocked && withinRadius
                    ? 'Valid'
                    : 'Ditolak'
              }
              tone={gpsTone}
            />
          </View>
          <View style={styles.gpsMeta}>
            <AppText variant="caption" style={styles.gpsMetaText}>
              {coords
                ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}${
                    coords.accuracy !== null ? ` · ±${Math.round(coords.accuracy)} m` : ''
                  }`
                : 'Koordinat belum tersedia'}
            </AppText>
            <AppText variant="caption" style={styles.gpsMetaText}>
              {isMocked ? 'Sumber: mock provider' : 'Sumber: GPS perangkat'}
            </AppText>
          </View>
        </View>

        <Button
          label={locationStatus === 'loading' ? 'Membaca lokasi…' : 'Perbarui lokasi'}
          variant="outline"
          icon={Navigation}
          disabled={locationStatus === 'loading'}
          onPress={() => {
            setLocationStatus('loading');
            void refreshLocation();
          }}
        />

        <InfoNote
          icon={Info}
          tone="neutral"
          body="Jarak dihitung ulang di server memakai koordinat tugas Anda. Absensi di luar radius akan ditolak. Deteksi mock location bergantung pada dukungan platform."
        />
      </Card>

      <SectionHeader title="2. Selfie kamera" subtitle="Wajib diambil langsung dari kamera" />
      <Card style={styles.sectionCard}>
        <Pressable
          onPress={() => void takeSelfie()}
          disabled={isCapturing}
          accessibilityRole="button"
          accessibilityLabel={selfie ? 'Ambil ulang selfie' : 'Ambil selfie'}
          style={({ pressed }) => [
            styles.selfieBox,
            selfie && styles.selfieBoxActive,
            { opacity: pressed || isCapturing ? 0.8 : 1 },
          ]}
        >
          {selfie ? (
            <>
              <Image source={{ uri: selfie.uri }} style={styles.selfieThumb} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" color={colors.accentDark}>
                  Selfie siap diunggah
                </AppText>
                <AppText variant="caption">
                  Diambil pukul {selfieAt ?? nowTime()} · dikirim bersama absensi
                </AppText>
              </View>
              <RotateCcw size={16} color={colors.accentDark} strokeWidth={2.2} />
            </>
          ) : (
            <>
              <View style={styles.selfiePlaceholder}>
                <Camera size={22} color={colors.textMuted} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">
                  {isCapturing ? 'Membuka kamera…' : 'Ambil selfie'}
                </AppText>
                <AppText variant="caption">
                  Kamera depan dipakai langsung; memilih dari galeri tidak tersedia.
                </AppText>
              </View>
            </>
          )}
        </Pressable>
        <InfoNote
          icon={AlertTriangle}
          tone="warning"
          body="Belum ada pencocokan wajah atau liveness detection. Foto disimpan di server dan hanya dapat diakses pemilik, HRD, dan Owner."
        />
      </Card>

      <SectionHeader title="3. Konfirmasi" subtitle="Periksa status sebelum mengirim" />
      <Card style={styles.sectionCard}>
        <DetailRow label="Karyawan" value={user.name} />
        <DetailRow label="Role kerja" value={role?.name ?? 'Belum diatur'} />
        <DetailRow label="Lokasi kerja" value={location?.name ?? '—'} />
        <DetailRow
          label="Jarak GPS"
          value={distance !== null ? `${distance} m` : 'Belum tersedia'}
          valueColor={withinRadius ? colors.text : colors.dangerDark}
        />
        <DetailRow
          label="Selfie"
          value={selfie ? 'Siap diunggah' : 'Belum diambil'}
          valueColor={selfie ? colors.accentDark : colors.warningDark}
        />
        <Divider />
        <View style={styles.checks}>
          <CheckItem label="Izin & koordinat GPS tersedia" ok={gpsValid} />
          <CheckItem label="Bukan mock location" ok={!!coords && !isMocked} />
          <CheckItem label="Dalam radius lokasi" ok={withinRadius} />
          <CheckItem label="Selfie kamera tersedia" ok={!!selfie} />
          <CheckItem
            label={mode === 'CHECK_IN' ? 'Belum absen masuk' : 'Sudah absen masuk'}
            ok={mode === 'CHECK_IN' ? !record?.checkInAt : !!record?.checkInAt}
          />
          <CheckItem label="Belum absen pulang" ok={!record?.checkOutAt} />
        </View>

        <Button
          label={
            alreadyDone
              ? 'Absensi hari ini selesai'
              : isSubmitting
                ? 'Mengirim…'
                : mode === 'CHECK_IN'
                  ? 'Absen masuk'
                  : 'Absen pulang'
          }
          icon={alreadyDone ? CheckCircle2 : mode === 'CHECK_IN' ? ScanFace : Timer}
          variant={alreadyDone ? 'secondary' : 'success'}
          disabled={!canSubmit || alreadyDone}
          onPress={() => setConfirmMode(mode)}
        />
        {!canSubmit && !alreadyDone ? (
          <AppText variant="caption" align="center" style={{ color: colors.dangerDark }}>
            Lengkapi GPS valid, radius lokasi, dan selfie kamera untuk melanjutkan.
          </AppText>
        ) : null}
      </Card>

      <Button
        label="Lihat riwayat absensi"
        variant="outline"
        onPress={() => navigation.navigate('AttendanceHistory')}
        style={{ marginTop: spacing.md }}
      />

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        title="Batas implementasi"
        body="Jam absensi resmi memakai waktu server. Deteksi mock location bergantung pada dukungan platform. Pencocokan biometrik/liveness belum termasuk cakupan. Pada build web, kamera memakai input file sebagai fallback pengembangan."
      />

      <ConfirmDialog
        visible={confirmMode !== null}
        title={confirmMode === 'CHECK_IN' ? 'Kirim absen masuk?' : 'Kirim absen pulang?'}
        message={
          confirmMode === 'CHECK_IN'
            ? `Absensi dicatat pada ${location?.name ?? 'lokasi kerja'} dengan jarak GPS ${distance ?? 0} m dan selfie kamera.`
            : `Absen pulang dicatat dengan jarak GPS ${distance ?? 0} m dan selfie kamera.`
        }
        confirmLabel={confirmMode === 'CHECK_IN' ? 'Ya, absen masuk' : 'Ya, absen pulang'}
        tone="success"
        onConfirm={() => void submit()}
        onCancel={() => setConfirmMode(null)}
      />

      {record?.checkInAt && !record.checkOutAt && record.status === 'LATE' ? (
        <InfoNote
          style={{ marginTop: spacing.sm }}
          icon={XCircle}
          tone="warning"
          body={`Absen masuk hari ini tercatat ${record.checkInAt} dan terlambat ${record.lateMinutes} menit. Denda keterlambatan masuk ke rekap payroll.`}
        />
      ) : null}
      {record?.checkOutAt ? (
        <InfoNote
          style={{ marginTop: spacing.sm }}
          icon={Clock3}
          tone="success"
          body={`Absen pulang tercatat ${formatTimeFromISO(`2000-01-01T${record.checkOutAt}:00`)}. Terima kasih, ${user.name.split(' ')[0]}.`}
        />
      ) : null}
    </Screen>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.checkItem}>
      {ok ? (
        <CheckCircle2 size={15} color={colors.accent} strokeWidth={2.4} />
      ) : (
        <XCircle size={15} color={colors.textMuted} strokeWidth={2.2} />
      )}
      <AppText variant="small" color={ok ? colors.text : colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroTime: { fontSize: 32, lineHeight: 38, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,252,0.08)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  heroStatusItem: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatusLabel: { fontSize: 9.5, color: colors.textOnDarkMuted, fontWeight: '600' },
  heroStatusValue: { fontSize: 13, color: colors.white, fontWeight: '700' },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(248,250,252,0.16)' },
  todayCard: { marginTop: spacing.md, gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  selfieStored: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionCard: { gap: spacing.md },
  assigned: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assignedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  gpsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gpsIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.08)',
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  gpsMetaText: { fontSize: 10.5, flexShrink: 1 },
  selfieBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  selfieBoxActive: {
    borderStyle: 'solid',
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentSubtle,
  },
  selfiePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieThumb: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.surface },
  checks: { gap: spacing.sm },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
