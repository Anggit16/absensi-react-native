import {
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  HeartPulse,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LEAVE_CATEGORY_LABEL, SUBMISSION_TYPE_LABEL } from '../../constants';
import { colors, radius, spacing } from '../../theme';
import type { Submission, SubmissionType, User } from '../../types';
import { formatDateRange, relativeDays } from '../../utils/date';
import { AppText } from '../common/AppText';
import { SubmissionStatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

const TYPE_ICON: Record<SubmissionType, typeof FileText> = {
  LEAVE: CalendarDays,
  PERMISSION: FileText,
  SICK: HeartPulse,
  RESIGN: LogOut,
};

export function SubmissionTypeIcon({ type, size = 18 }: { type: SubmissionType; size?: number }) {
  const Icon = TYPE_ICON[type];
  const palette =
    type === 'RESIGN'
      ? { bg: colors.dangerSoft, fg: colors.dangerDark }
      : type === 'SICK'
        ? { bg: colors.warningSoft, fg: colors.warningDark }
        : type === 'PERMISSION'
          ? { bg: colors.infoSoft, fg: colors.infoDark }
          : { bg: colors.accentSoft, fg: colors.accentDark };
  return (
    <View style={[styles.typeIcon, { backgroundColor: palette.bg }]}>
      <Icon size={size} color={palette.fg} strokeWidth={2.1} />
    </View>
  );
}

export function ApprovalStageDots({ submission }: { submission: Submission }) {
  const hrd = submission.approvals.find((step) => step.stage === 'HRD');
  const owner = submission.approvals.find((step) => step.stage === 'OWNER');

  const stages = [
    { key: 'HRD', label: 'HRD', decision: hrd?.decision, waiting: submission.status === 'PENDING_HRD' },
    {
      key: 'OWNER',
      label: 'Owner',
      decision: owner?.decision,
      waiting: submission.status === 'PENDING_OWNER',
    },
  ];

  return (
    <View style={styles.stageRow}>
      {stages.map((stage) => {
        const approved = stage.decision === 'APPROVED';
        const rejected = stage.decision === 'REJECTED';
        const color = approved
          ? colors.accent
          : rejected
            ? colors.danger
            : stage.waiting
              ? colors.warning
              : colors.borderStrong;
        return (
          <View key={stage.key} style={styles.stage}>
            <View style={[styles.stageDot, { backgroundColor: `${color}1F`, borderColor: color }]}>
              {approved ? (
                <Check size={9} color={color} strokeWidth={3.4} />
              ) : rejected ? (
                <X size={9} color={color} strokeWidth={3.4} />
              ) : (
                <View style={[styles.stageDotInner, { backgroundColor: color }]} />
              )}
            </View>
            <AppText style={{ fontSize: 9.5, fontWeight: '700', color }}>
              {stage.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

interface SubmissionCardProps {
  submission: Submission;
  user?: User;
  showEmployee?: boolean;
  onPress?: () => void;
}

export function SubmissionCard({ submission, user, showEmployee = false, onPress }: SubmissionCardProps) {
  const title =
    submission.type === 'LEAVE' && submission.leaveCategory
      ? LEAVE_CATEGORY_LABEL[submission.leaveCategory]
      : submission.type === 'PERMISSION' && submission.permissionType
        ? `Izin ${submission.permissionType}`
        : SUBMISSION_TYPE_LABEL[submission.type];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, status ${submission.status}`}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.78 : 1 }]}
    >
      <View style={styles.headerRow}>
        <SubmissionTypeIcon type={submission.type} />
        <View style={styles.headerText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {formatDateRange(submission.startDate, submission.endDate)} • {submission.days} hari
          </AppText>
          {showEmployee && user ? (
            <View style={styles.employeeRow}>
              <Avatar name={user.name} size={16} />
              <AppText variant="caption" numberOfLines={1}>
                {user.name} • {user.employeeCode}
              </AppText>
            </View>
          ) : null}
        </View>
        <SubmissionStatusBadge status={submission.status} />
      </View>

      <AppText variant="small" numberOfLines={2} style={styles.reason}>
        {submission.reason}
      </AppText>

      <View style={styles.footerRow}>
        <View style={styles.footerMeta}>
          <FileText size={11} color={colors.textMuted} strokeWidth={2} />
          <AppText variant="caption">
            {submission.code} • diajukan {relativeDays(submission.createdAt)}
          </AppText>
        </View>
        <View style={styles.footerRight}>
          <ApprovalStageDots submission={submission} />
          {onPress ? <ChevronRight size={14} color={colors.textMuted} strokeWidth={2.2} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function ApprovalStepsSummary({ submission }: { submission: Submission }) {
  const steps = submission.approvals;
  return (
    <View style={styles.summaryRow}>
      <ShieldCheck size={13} color={colors.textMuted} strokeWidth={2} />
      <AppText variant="caption">
        {steps.length === 0
          ? 'Belum ada keputusan'
          : steps.map((step) => `${step.stage}: ${step.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`).join(' • ')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reason: { color: colors.textSecondary, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stageDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotInner: { width: 5, height: 5, borderRadius: 3 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
