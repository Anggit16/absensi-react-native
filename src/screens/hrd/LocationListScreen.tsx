import {
  ChevronRight,
  Crosshair,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccessDenied } from '../../components/common/AccessDenied';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState, InfoNote } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { SectionHeader } from '../../components/common/Section';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import { LOCATION_TYPE_LABEL } from '../../constants';
import { useAppNavigation } from '../../navigation/types';

export function LocationListScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { locations, roles, users } = useApp();
  const [search, setSearch] = useState('');

  const canManage = user.role === 'HRD';

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return locations.filter((location) =>
      term
        ? location.name.toLowerCase().includes(term) ||
          location.address.toLowerCase().includes(term)
        : true,
    );
  }, [locations, search]);

  const usage = (locationId: string) => ({
    roles: roles.filter((role) => role.locationId === locationId).length,
    employees: users.filter((item) => item.locationId === locationId && item.role !== 'OWNER').length,
  });

  if (user.role === 'EMPLOYEE') {
    return (
      <Screen header={<ScreenHeader title="Lokasi kerja" onBack={() => navigation.goBack()} />}>
        <AccessDenied description="Master lokasi kerja hanya dapat diakses Owner dan Admin/HRD." />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Lokasi kerja"
          subtitle={`${locations.length} titik lokasi geofencing`}
          onBack={() => navigation.goBack()}
          right={
            canManage ? (
              <Button
                label="Tambah"
                size="sm"
                icon={Plus}
                fullWidth={false}
                onPress={() => navigation.navigate('LocationForm')}
              />
            ) : undefined
          }
        />
      }
      footer={
        canManage ? (
          <Button
            label="Tambah lokasi kerja"
            icon={Plus}
            onPress={() => navigation.navigate('LocationForm')}
          />
        ) : undefined
      }
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>GEOFENCING</AppText>
            <AppText style={styles.heroValue}>{locations.length} lokasi</AppText>
            <AppText style={styles.heroHint}>
              Radius absensi {Math.min(...locations.map((item) => item.radiusMeters), 0)}–
              {Math.max(...locations.map((item) => item.radiusMeters), 0)} meter
            </AppText>
          </View>
          <View style={styles.heroIcon}>
            <MapPin size={22} color={colors.accent} strokeWidth={2} />
          </View>
        </View>
      </Card>

      <SectionHeader title="Daftar lokasi" subtitle="Ketuk untuk melihat pengaturan" />
      <SearchField value={search} onChangeText={setSearch} placeholder="Cari nama atau alamat lokasi" />

      <View style={styles.list}>
        {filtered.map((location) => {
          const counts = usage(location.id);
          return (
            <Pressable
              key={location.id}
              onPress={() => navigation.navigate('LocationForm', { locationId: location.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ubah lokasi ${location.name}`}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.icon}>
                  <MapPin size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {location.name}
                  </AppText>
                  <AppText variant="caption">{LOCATION_TYPE_LABEL[location.type]}</AppText>
                </View>
                <Badge
                  label={location.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  tone={location.status === 'ACTIVE' ? 'success' : 'neutral'}
                />
              </View>

              <View style={styles.addressRow}>
                <MapPin size={12} color={colors.textMuted} strokeWidth={2} />
                <AppText variant="caption" style={{ flex: 1 }} numberOfLines={2}>
                  {location.address}
                </AppText>
              </View>

              <View style={styles.coordRow}>
                <View style={styles.coordItem}>
                  <Crosshair size={12} color={colors.infoDark} strokeWidth={2.2} />
                  <AppText variant="caption">
                    {location.latitude}, {location.longitude}
                  </AppText>
                </View>
                <View style={styles.coordItem}>
                  <ShieldCheck size={12} color={colors.accentDark} strokeWidth={2.2} />
                  <AppText variant="caption">Radius {location.radiusMeters} m</AppText>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.countItem}>
                  <Users size={12} color={colors.textMuted} strokeWidth={2} />
                  <AppText variant="caption">
                    {counts.employees} karyawan · {counts.roles} role
                  </AppText>
                </View>
                <ChevronRight size={15} color={colors.textMuted} strokeWidth={2.2} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Lokasi tidak ditemukan"
          description="Ubah kata kunci atau tambahkan lokasi kerja baru."
          actionLabel={canManage ? 'Tambah lokasi' : undefined}
          onAction={canManage ? () => navigation.navigate('LocationForm') : undefined}
        />
      ) : null}

      <InfoNote
        style={{ marginTop: spacing.md }}
        icon={Info}
        tone="neutral"
        title="Radius = batas absensi"
        body="Server membandingkan jarak GPS perangkat dengan radius lokasi. Deteksi mock location bergantung pada dukungan platform."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.sm, marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  coordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  coordItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  countItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
});
