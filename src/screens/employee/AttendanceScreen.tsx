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
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge, AttendanceStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { ConfirmDialog } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { DetailRow, Divider, SectionHeader } from '../../components/common/Section';
import { SelectField } from '../../components/common/SelectField';
import { useToast } from '../../components/common/Toast';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { formatDateLong, formatTimeFromISO, nowTime, todayISO } from '../../utils/date';
import { useAppNavigation } from '../../navigation/types';

export function AttendanceScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { showToast } = useToast();
  const { locations, attendances, checkAttendance, getRoleForUser, getLocationForUser, company } = useApp();

  const role = getRoleForUser(user);
  const defaultLocation = getLocationForUser(user);
  const today = todayISO();

  const [locationId, setLocationId] = useState(defaultLocation?.id ?? locations[0]?.id ?? '');
  const [outsideRadius, setOutsideRadius] = useState(false);
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);

  const location = locations.find((item) => item.id === locationId) ?? defaultLocation;

  const record = attendances.find(
    (item) => item.userId === user.id && item.date === today,
  );

  const simulatedDistance = useMemo(() => {
    if (!location) return 0;
    return outsideRadius ? location.radiusMeters + 275 : Math.max(12, Math.round(location.radiusMeters * 0.18));
  }, [location, outsideRadius]);

  const withinRadius = !!location && simulatedDistance <= location.radiusMeters;
  const mode: 'CHECK_IN' | 'CHECK_OUT' = record?.checkInAt ? 'CHECK_OUT' : 'CHECK_IN';
  const alreadyDone = mode === 'CHECK_OUT' && !!record?.checkOutAt;

  const canSubmit = !!location && withinRadius && selfieCaptured && !alreadyDone;

  const submit = () => {
    if (!location) {
      showToast('Pilih lokasi kerja terlebih dahulu.', 'error');
      return;
    }
    const result = checkAttendance({
      userId: user.id,
      mode,
      locationId: location.id,
      locationName: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      distanceMeters: simulatedDistance,
      withinRadius,
      selfieCaptured,
    });
    setConfirmMode(null);
    if (result.ok) {
      setSelfieCaptured(false);
      showToast(result.message, 'success', mode === 'CHECK_IN' ? 'Absen masuk berhasil' : 'Absen pulang berhasil');
    } else {
      showToast(result.message, 'error');
    }
  };

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
                {record.locationName ?? 'Lokasi tidak tercatat'} · simulasi {record.distanceMeters ?? 0} m dari titik
              </AppText>
            </View>
            <AttendanceStatusBadge status={record.status} />
          </View>
          {record.selfieCaptured ? (
            <View style={styles.selfieStored}>
              <ShieldCheck size={13} color={colors.accentDark} strokeWidth={2.2} />
              <AppText variant="caption" style={{ color: colors.accentDark }}>
                Selfie simulasi tercatat (bukan biometrik)
              </AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="1. Lokasi absensi" subtitle="Pilih titik kerja dan simulasikan posisi GPS" />
      <Card style={styles.sectionCard}>
        <SelectField
          label="Lokasi kerja"
          value={location?.id}
          options={locations.map((item) => ({
            value: item.id,
            label: item.name,
            description: `${item.address} · radius ${item.radiusMeters} m`,
          }))}
          onChange={(value) => setLocationId(value)}
          helper={
            defaultLocation
              ? `Lokasi default role Anda: ${defaultLocation.name}`
              : 'Role Anda belum memiliki lokasi default.'
          }
        />

        <View style={styles.simRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="smallStrong">Simulasikan di luar radius</AppText>
            <AppText variant="caption">
              Untuk menguji penolakan absensi saat posisi di luar geofencing.
            </AppText>
          </View>
          <Switch
            value={outsideRadius}
            onValueChange={setOutsideRadius}
            trackColor={{ false: colors.borderStrong, true: colors.warning }}
            thumbColor={colors.white}
            accessibilityLabel="Simulasikan posisi di luar radius"
          />
        </View>

        <View
          style={[
            styles.gpsBox,
            { backgroundColor: withinRadius ? colors.accentSubtle : colors.dangerSoft, borderColor: withinRadius ? colors.accentSoft : '#FECACA' },
          ]}
        >
          <View style={styles.gpsHeader}>
            <View style={styles.gpsIcon}>
              <Navigation
                size={17}
                color={withinRadius ? colors.accentDark : colors.dangerDark}
                strokeWidth={2.2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="smallStrong" color={withinRadius ? colors.accentDark : colors.dangerDark}>
                {withinRadius ? 'Dalam radius geofencing' : 'Di luar radius geofencing'}
              </AppText>
              <AppText variant="caption" style={{ color: withinRadius ? colors.accentDark : colors.dangerDark }}>
                Jarak simulasi {simulatedDistance} m · batas {location?.radiusMeters ?? 0} m
              </AppText>
            </View>
            <Badge label={withinRadius ? 'Valid' : 'Ditolak'} tone={withinRadius ? 'success' : 'danger'} />
          </View>
          <View style={styles.gpsMeta}>
            <AppText variant="caption" style={styles.gpsMetaText}>
              {location ? `${location.latitude}, ${location.longitude}` : 'Koordinat belum tersedia'}
            </AppText>
            <AppText variant="caption" style={styles.gpsMetaText}>
              Mode: simulasi
            </AppText>
          </View>
        </View>

        <InfoNote
          icon={Info}
          tone="neutral"
          body="Aplikasi ini tidak membaca GPS asli dan tidak memverifikasi fake GPS. Nilai jarak di atas dihasilkan dari simulasi untuk menguji aturan radius."
        />
      </Card>

      <SectionHeader title="2. Selfie simulasi" subtitle="Wajib diambil sebelum absen" />
      <Card style={styles.sectionCard}>
        <Pressable
          onPress={() => setSelfieCaptured((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={selfieCaptured ? 'Hapus selfie simulasi' : 'Ambil selfie simulasi'}
          style={({ pressed }) => [
            styles.selfieBox,
            selfieCaptured && styles.selfieBoxActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {selfieCaptured ? (
            <>
              <View style={styles.selfiePreview}>
                <AppText style={styles.selfieInitials}>
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" color={colors.accentDark}>
                  Selfie simulasi siap
                </AppText>
                <AppText variant="caption">Diambil pukul {nowTime()} · data tidak disimpan ke server</AppText>
              </View>
              <RotateCcw size={16} color={colors.accentDark} strokeWidth={2.2} />
            </>
          ) : (
            <>
              <View style={styles.selfiePlaceholder}>
                <Camera size={22} color={colors.textMuted} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">Ambil selfie simulasi</AppText>
                <AppText variant="caption">
                  Ketuk untuk menandai selfie sudah diambil. Kamera asli tidak digunakan.
                </AppText>
              </View>
            </>
          )}
        </Pressable>
        <InfoNote
          icon={AlertTriangle}
          tone="warning"
          body="Tidak ada verifikasi wajah, liveness detection, atau penyimpanan foto pada fase frontend ini."
        />
      </Card>

      <SectionHeader title="3. Konfirmasi" subtitle="Periksa status sebelum mengirim" />
      <Card style={styles.sectionCard}>
        <DetailRow label="Karyawan" value={user.name} />
        <DetailRow label="Role kerja" value={role?.name ?? 'Belum diatur'} />
        <DetailRow label="Lokasi dipilih" value={location?.name ?? '—'} />
        <DetailRow
          label="Jarak simulasi"
          value={`${simulatedDistance} m`}
          valueColor={withinRadius ? colors.text : colors.dangerDark}
        />
        <DetailRow
          label="Selfie"
          value={selfieCaptured ? 'Sudah diambil' : 'Belum diambil'}
          valueColor={selfieCaptured ? colors.accentDark : colors.warningDark}
        />
        <Divider />
        <View style={styles.checks}>
          <CheckItem label="Dalam radius lokasi" ok={withinRadius} />
          <CheckItem label="Selfie simulasi tersedia" ok={selfieCaptured} />
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
              : mode === 'CHECK_IN'
                ? 'Absen masuk'
                : 'Absen pulang'
          }
          icon={alreadyDone ? CheckCircle2 : mode === 'CHECK_IN' ? FingerprintIcon : Timer}
          variant={alreadyDone ? 'secondary' : 'success'}
          disabled={!canSubmit || alreadyDone}
          onPress={() => setConfirmMode(mode)}
        />
        {!canSubmit && !alreadyDone ? (
          <AppText variant="caption" align="center" style={{ color: colors.dangerDark }}>
            Lengkapi lokasi valid dan selfie simulasi untuk melanjutkan.
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
        title="Batas simulasi"
        body="Absen masuk/pulang dihitung memakai jam perangkat dan disimpan pada mock state. Belum ada sinkronisasi server, anti fake GPS, atau validasi biometrik."
      />

      <ConfirmDialog
        visible={confirmMode !== null}
        title={confirmMode === 'CHECK_IN' ? 'Kirim absen masuk?' : 'Kirim absen pulang?'}
        message={
          confirmMode === 'CHECK_IN'
            ? `Absensi akan dicatat pada ${location?.name ?? 'lokasi terpilih'} dengan jarak simulasi ${simulatedDistance} m.`
            : 'Absen pulang akan dicatat pada waktu perangkat saat ini.'
        }
        confirmLabel={confirmMode === 'CHECK_IN' ? 'Ya, absen masuk' : 'Ya, absen pulang'}
        tone="success"
        onConfirm={submit}
        onCancel={() => setConfirmMode(null)}
      />

      {record?.checkInAt && !record.checkOutAt && record.status === 'LATE' ? (
        <InfoNote
          style={{ marginTop: spacing.sm }}
          icon={XCircle}
          tone="warning"
          body={`Absen masuk hari ini tercatat ${record.checkInAt} dan terlambat ${record.lateMinutes} menit. Denda keterlambatan akan masuk ke rekap payroll demo.`}
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

const FingerprintIcon = ScanFace;

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
  simRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  },
  gpsMetaText: { fontSize: 10.5 },
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
  selfiePreview: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieInitials: { fontSize: 16, fontWeight: '700', color: colors.white },
  checks: { gap: spacing.sm },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
