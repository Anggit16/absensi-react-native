import {
  CalendarDays,
  ClipboardList,
  FilePlus2,
  Inbox,
  Plus,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { FilterChips } from '../../components/common/SegmentedTabs';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { useAppNavigation } from '../../navigation/types';

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function SubmissionListScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { submissions, getBalance } = useApp();
  const [filter, setFilter] = useState<Filter>('ALL');

  const balance = getBalance(user.id);
  const remaining = balance ? balance.totalQuota - balance.used : 0;

  const mine = useMemo(
    () =>
      submissions
        .filter((submission) => submission.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [submissions, user.id],
  );

  const counts = useMemo(
    () => ({
      ALL: mine.length,
      PENDING: mine.filter((item) => ['PENDING_HRD', 'PENDING_OWNER'].includes(item.status)).length,
      APPROVED: mine.filter((item) => item.status === 'FULLY_APPROVED').length,
      REJECTED: mine.filter((item) => item.status === 'REJECTED').length,
    }),
    [mine],
  );

  const filtered = useMemo(() => {
    if (filter === 'ALL') return mine;
    if (filter === 'PENDING') {
      return mine.filter((item) => ['PENDING_HRD', 'PENDING_OWNER'].includes(item.status));
    }
    if (filter === 'APPROVED') return mine.filter((item) => item.status === 'FULLY_APPROVED');
    return mine.filter((item) => item.status === 'REJECTED' || item.status === 'CANCELLED');
  }, [filter, mine]);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Pengajuan saya"
          subtitle="Cuti, izin, sakit, dan resign"
          onMenu={() => navigation.navigate('Menu')}
          right={
            <Button
              label="Buat"
              size="sm"
              icon={Plus}
              fullWidth={false}
              onPress={() => navigation.navigate('SubmissionCreate')}
            />
          }
        />
      }
      footer={<Button label="Buat pengajuan baru" icon={FilePlus2} onPress={() => navigation.navigate('SubmissionCreate')} />}
    >
      <Card tone="dark" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.heroEyebrow}>RINGKASAN PENGAJUAN</AppText>
            <AppText style={styles.heroValue}>{counts.PENDING} menunggu</AppText>
            <AppText style={styles.heroHint}>
              {counts.APPROVED} disetujui · {counts.REJECTED} ditolak/dibatalkan
            </AppText>
          </View>
          <View style={styles.heroQuota}>
            <AppText style={styles.heroQuotaValue}>{remaining}</AppText>
            <AppText style={styles.heroQuotaLabel}>sisa cuti</AppText>
          </View>
        </View>
        <View style={styles.heroLegend}>
          <Badge label="Alur: HRD → Owner" tone="dark" />
          <Badge label="Kuota dipotong setelah final" tone="dark" />
        </View>
      </Card>

      <FilterChips
        style={{ marginTop: spacing.md }}
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={[
          { value: 'ALL', label: 'Semua', count: counts.ALL },
          { value: 'PENDING', label: 'Diproses', count: counts.PENDING },
          { value: 'APPROVED', label: 'Disetujui', count: counts.APPROVED },
          { value: 'REJECTED', label: 'Ditolak', count: counts.REJECTED },
        ]}
      />

      <View style={styles.list}>
        {filtered.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'ALL' ? Inbox : ClipboardList}
          title={
            filter === 'ALL'
              ? 'Belum ada pengajuan'
              : filter === 'PENDING'
                ? 'Tidak ada pengajuan berjalan'
                : filter === 'APPROVED'
                  ? 'Belum ada pengajuan disetujui'
                  : 'Tidak ada pengajuan ditolak'
          }
          description={
            filter === 'ALL'
              ? 'Mulai dengan mengajukan cuti tahunan, izin pribadi, sakit, atau resign.'
              : 'Coba pilih filter lain atau buat pengajuan baru.'
          }
          actionLabel="Buat pengajuan"
          onAction={() => navigation.navigate('SubmissionCreate')}
        />
      ) : null}

      <Card style={styles.tipCard}>
        <CalendarDays size={18} color={colors.primary} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <AppText variant="smallStrong">Kuota hanya dipotong satu kali</AppText>
          <AppText variant="caption" style={{ lineHeight: 16 }}>
            Cuti tahunan mengurangi saldo setelah HRD <AppText style={styles.bold}>dan</AppText> Owner
            menyetujui. Persetujuan HRD saja belum mengubah saldo.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.white },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroQuota: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(16,185,129,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroQuotaValue: { fontSize: 22, fontWeight: '700', color: colors.accent },
  heroQuotaLabel: { fontSize: 9.5, color: colors.textOnDarkMuted },
  heroLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  list: { gap: spacing.sm, marginTop: spacing.md },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  bold: { fontWeight: '700', color: colors.text },
});
