import { Check, Clock3, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { Submission } from '../../types';
import { formatDateTime } from '../../utils/date';
import { AppText } from '../common/AppText';

interface TimelineEntry {
  title: string;
  subtitle: string;
  note?: string;
  state: 'done' | 'rejected' | 'waiting' | 'skipped';
}

export function ApprovalTimeline({ submission, submittedByName }: { submission: Submission; submittedByName: string }) {
  const hrd = submission.approvals.find((step) => step.stage === 'HRD');
  const owner = submission.approvals.find((step) => step.stage === 'OWNER');

  const entries: TimelineEntry[] = [
    {
      title: 'Pengajuan dikirim',
      subtitle: `${submittedByName} • ${formatDateTime(submission.createdAt)}`,
      state: 'done',
    },
  ];

  if (hrd) {
    entries.push({
      title: hrd.decision === 'APPROVED' ? 'Diverifikasi HRD' : 'Ditolak HRD',
      subtitle: `${hrd.actorName} • ${formatDateTime(hrd.decidedAt)}`,
      note: hrd.note,
      state: hrd.decision === 'APPROVED' ? 'done' : 'rejected',
    });
  } else if (submission.status === 'CANCELLED') {
    entries.push({
      title: 'Dibatalkan karyawan',
      subtitle: submission.cancelledAt ? formatDateTime(submission.cancelledAt) : 'Sebelum verifikasi HRD',
      state: 'skipped',
    });
  } else {
    entries.push({
      title: 'Menunggu verifikasi HRD',
      subtitle: 'Admin/HRD memeriksa kelengkapan pengajuan',
      state: 'waiting',
    });
  }

  if (owner) {
    entries.push({
      title: owner.decision === 'APPROVED' ? 'Disetujui Owner' : 'Ditolak Owner',
      subtitle: `${owner.actorName} • ${formatDateTime(owner.decidedAt)}`,
      note: owner.note,
      state: owner.decision === 'APPROVED' ? 'done' : 'rejected',
    });
  } else if (submission.status === 'PENDING_OWNER') {
    entries.push({
      title: 'Menunggu persetujuan Owner',
      subtitle: 'Pengajuan telah lolos verifikasi HRD',
      state: 'waiting',
    });
  } else if (submission.status === 'REJECTED' || submission.status === 'CANCELLED') {
    entries.push({
      title: 'Tidak diproses Owner',
      subtitle: 'Alur persetujuan berhenti pada tahap sebelumnya',
      state: 'skipped',
    });
  } else {
    entries.push({
      title: 'Persetujuan Owner',
      subtitle: 'Diproses setelah verifikasi HRD selesai',
      state: 'skipped',
    });
  }

  return (
    <View style={styles.wrapper}>
      {entries.map((entry, index) => {
        const color =
          entry.state === 'done'
            ? colors.accent
            : entry.state === 'rejected'
              ? colors.danger
              : entry.state === 'waiting'
                ? colors.warning
                : colors.borderStrong;
        const isLast = index === entries.length - 1;
        return (
          <View key={`${entry.title}-${index}`} style={styles.row}>
            <View style={styles.indicator}>
              <View style={[styles.dot, { backgroundColor: `${color}1A`, borderColor: color }]}>
                {entry.state === 'done' ? (
                  <Check size={10} color={color} strokeWidth={3.4} />
                ) : entry.state === 'rejected' ? (
                  <X size={10} color={color} strokeWidth={3.4} />
                ) : entry.state === 'waiting' ? (
                  <Clock3 size={10} color={color} strokeWidth={3} />
                ) : (
                  <View style={[styles.dotInner, { backgroundColor: color }]} />
                )}
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.content}>
              <AppText variant="bodyStrong" color={entry.state === 'skipped' ? colors.textMuted : colors.text}>
                {entry.title}
              </AppText>
              <AppText variant="caption">{entry.subtitle}</AppText>
              {entry.note ? (
                <View style={styles.note}>
                  <AppText style={styles.noteText}>“{entry.note}”</AppText>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  indicator: { alignItems: 'center', width: 22 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: { width: 6, height: 6, borderRadius: 3 },
  line: { width: 2, flex: 1, minHeight: 22, backgroundColor: colors.border, marginVertical: 2 },
  content: { flex: 1, paddingBottom: spacing.md, gap: 2 },
  note: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  noteText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary, fontStyle: 'italic' },
});
