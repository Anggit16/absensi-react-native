import { CheckCircle2, Clock3, Inbox } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/Feedback';
import { ScreenHeader } from '../../components/common/Header';
import { Screen } from '../../components/common/Screen';
import { SegmentedTabs } from '../../components/common/SegmentedTabs';
import { SubmissionCard } from '../../components/submissions/SubmissionCard';
import { ROLE_LABEL, SUBMISSION_STATUS_DESCRIPTION } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, spacing } from '../../theme';
import { useAppNavigation } from '../../navigation/types';

export function ApprovalInboxScreen() {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { submissions, getUser } = useApp();
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  const pendingStatus = user.role === 'HRD' ? 'PENDING_HRD' : 'PENDING_OWNER';

  const pending = useMemo(
    () =>
      submissions
        .filter((submission) => submission.status === pendingStatus)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [pendingStatus, submissions],
  );

  const history = useMemo(
    () =>
      submissions
        .filter((submission) =>
          ['FULLY_APPROVED', 'REJECTED', 'CANCELLED'].includes(submission.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [submissions],
  );

  const list = tab === 'pending' ? pending : history;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Persetujuan"
          eyebrow={ROLE_LABEL[user.role]}
          subtitle={
            user.role === 'HRD'
              ? 'Verifikasi tahap pertama pengajuan karyawan'
              : 'Persetujuan final setelah verifikasi HRD'
          }
          onMenu={() => navigation.navigate('Menu')}
        />
      }
    >
      <Card tone={pending.length > 0 ? 'warning' : 'default'} style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryIcon, { backgroundColor: pending.length > 0 ? colors.warning : colors.accent }]}>
            {pending.length > 0 ? (
              <Clock3 size={18} color={colors.white} strokeWidth={2.2} />
            ) : (
              <CheckCircle2 size={18} color={colors.white} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.summaryText}>
            <AppText variant="bodyStrong">
              {pending.length > 0
                ? `${pending.length} pengajuan menunggu ${user.role === 'HRD' ? 'verifikasi Anda' : 'persetujuan Anda'}`
                : 'Tidak ada pengajuan menunggu'}
            </AppText>
            <AppText variant="caption">
              {user.role === 'HRD'
                ? 'Setelah disetujui, pengajuan otomatis diteruskan ke Owner.'
                : 'Anda hanya melihat pengajuan yang sudah lolos verifikasi HRD.'}
            </AppText>
          </View>
        </View>
      </Card>

      <SegmentedTabs
        options={[
          { value: 'pending', label: 'Menunggu', count: pending.length },
          { value: 'history', label: 'Riwayat', count: history.length },
        ]}
        value={tab}
        onChange={(value) => setTab(value as 'pending' | 'history')}
        style={{ marginTop: spacing.md }}
      />

      <View style={styles.list}>
        {list.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            user={getUser(submission.userId)}
            showEmployee
            onPress={() => navigation.navigate('SubmissionDetail', { submissionId: submission.id })}
          />
        ))}
      </View>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'pending' ? 'Semua beres!' : 'Belum ada riwayat'}
          description={
            tab === 'pending'
              ? `Tidak ada pengajuan pada tahap ${SUBMISSION_STATUS_DESCRIPTION[pendingStatus]}.`
              : 'Riwayat keputusan pengajuan akan tampil di sini setelah diproses.'
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1, gap: 2 },
  list: { gap: spacing.sm, marginTop: spacing.md },
});
