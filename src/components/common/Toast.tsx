import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from './AppText';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  tone: ToastTone;
  title?: string;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const PALETTES: Record<ToastTone, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2, iconColor: colors.accentDark },
  error: { bg: '#FEF2F2', border: '#FECACA', icon: AlertTriangle, iconColor: colors.dangerDark },
  info: { bg: '#EFF6FF', border: '#BFDBFE', icon: Info, iconColor: colors.infoDark },
  warning: { bg: '#FFFBEB', border: '#FDE68A', icon: AlertTriangle, iconColor: colors.warningDark },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success', title?: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone, title });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => hide(), 3400);
    },
    [hide, opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const palette = toast ? PALETTES[toast.tone] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && palette ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + spacing.sm, opacity }]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole="alert"
            accessibilityLabel={toast.message}
            style={[styles.toast, { backgroundColor: palette.bg, borderColor: palette.border }]}
          >
            <palette.icon size={18} color={palette.iconColor} strokeWidth={2.2} />
            <View style={styles.toastText}>
              {toast.title ? (
                <AppText style={{ fontSize: 12, fontWeight: '700', color: palette.iconColor }}>
                  {toast.title}
                </AppText>
              ) : null}
              <AppText style={{ fontSize: 12.5, lineHeight: 18, color: colors.text }}>
                {toast.message}
              </AppText>
            </View>
            <X size={14} color={colors.textMuted} strokeWidth={2.2} />
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    ...(shadows.floating as object),
  },
  toastText: { flex: 1, gap: 1 },
});
