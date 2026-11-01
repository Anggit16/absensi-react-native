import { ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function AccessDenied({
  title = 'Akses terbatas',
  description,
  actionLabel,
  onAction,
}: {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.icon}>
        <ShieldAlert size={28} color={colors.warningDark} strokeWidth={1.9} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText variant="small" align="center" style={styles.description}>
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" size="sm" fullWidth={false} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  description: { color: colors.textSecondary, maxWidth: 300 },
});
