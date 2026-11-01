import { AlertTriangle, X } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightRatio?: number;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightRatio = 0.88,
  scrollable = true,
  contentStyle,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup panel" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                maxHeight: `${maxHeightRatio * 100}%`,
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
            ]}
          >
            <View style={styles.handle} />
            {title ? (
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleWrap}>
                  <AppText variant="title">{title}</AppText>
                  {subtitle ? (
                    <AppText variant="small" style={{ marginTop: 2 }}>
                      {subtitle}
                    </AppText>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup"
                  hitSlop={8}
                  style={styles.closeButton}
                >
                  <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : null}
            {scrollable ? (
              <ScrollView
                style={styles.sheetBody}
                contentContainerStyle={[styles.sheetContent, contentStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.sheetContent, contentStyle]}>{children}</View>
            )}
            {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const palette =
    tone === 'danger' ? colors.danger : tone === 'success' ? colors.accent : tone === 'warning' ? colors.warning : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogRoot}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Tutup dialog" />
        <View style={styles.dialog}>
          <View style={[styles.dialogIcon, { backgroundColor: `${palette}1A` }]}>
            {tone === 'danger' || tone === 'warning' ? (
              <AlertTriangle size={22} color={palette} strokeWidth={2.2} />
            ) : (
              <View style={[styles.dialogCheck, { backgroundColor: palette }]} />
            )}
          </View>
          <AppText variant="title" align="center">
            {title}
          </AppText>
          <AppText variant="small" align="center" style={styles.dialogMessage}>
            {message}
          </AppText>
          <View style={styles.dialogActions}>
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.dialogButton} />
            <Button
              label={confirmLabel}
              variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'}
              onPress={onConfirm}
              style={styles.dialogButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    ...(shadows.floating as object),
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitleWrap: { flex: 1 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { flexGrow: 0 },
  sheetContent: { padding: spacing.lg, gap: spacing.md },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dialogRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
    ...(shadows.floating as object),
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dialogCheck: { width: 18, height: 18, borderRadius: 9 },
  dialogMessage: { color: colors.textSecondary, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, width: '100%' },
  dialogButton: { flex: 1 },
});
