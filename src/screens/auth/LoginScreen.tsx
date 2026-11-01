import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Fingerprint, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { InlineError } from '../../components/common/Feedback';
import { TextField } from '../../components/common/TextField';
import { DEMO_ACCOUNTS } from '../../constants';
import { useApp } from '../../store/AppProvider';
import { colors, radius, shadows, spacing } from '../../theme';
import { isValidEmail } from '../../utils/validation';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isAuthenticating, authError } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const handleSubmit = async () => {
    const nextErrors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) nextErrors.identifier = 'Email atau username wajib diisi.';
    else if (identifier.includes('@') && !isValidEmail(identifier)) {
      nextErrors.identifier = 'Format email tidak valid.';
    }
    if (!password.trim()) nextErrors.password = 'Password wajib diisi.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await login(identifier, password);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F172A', '#16233B', '#0B1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Fingerprint size={30} color={colors.primary} strokeWidth={2.1} />
            </View>
            <AppText style={styles.brandName}>AbsensiPro</AppText>
            <AppText style={styles.brandTagline}>
              Presensi, pengajuan, dan payroll karyawan dalam satu aplikasi.
            </AppText>
            <View style={styles.brandChips}>
              <Badge label="Multi-company" tone="dark" />
              <Badge label="Dual approval" tone="dark" />
              <Badge label="Payroll demo" tone="dark" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AppText variant="titleLg">Masuk ke akun</AppText>
              <AppText variant="small" style={{ marginTop: 2 }}>
                Gunakan akun demo di bawah untuk menguji ketiga role.
              </AppText>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email atau username"
                placeholder="nama@perusahaan.id"
                value={identifier}
                onChangeText={(value) => {
                  setIdentifier(value);
                  setErrors((previous) => ({ ...previous, identifier: undefined }));
                }}
                leftIcon={Mail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                error={errors.identifier}
                required
              />
              <TextField
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrors((previous) => ({ ...previous, password: undefined }));
                }}
                leftIcon={Lock}
                secureToggle
                autoCapitalize="none"
                error={errors.password}
                required
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
              {authError ? <InlineError message={authError} /> : null}
              <Button
                label="Masuk"
                icon={ArrowRight}
                iconPosition="right"
                onPress={handleSubmit}
                loading={isAuthenticating}
              />
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <AppText variant="caption">Akun demo</AppText>
              <View style={styles.divider} />
            </View>

            <View style={styles.demoList}>
              {DEMO_ACCOUNTS.map((account) => (
                <Pressable
                  key={account.key}
                  disabled={isAuthenticating}
                  onPress={() => {
                    setIdentifier(account.email);
                    setPassword(account.password);
                    setErrors({});
                    void login(account.email, account.password);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Masuk sebagai ${account.label}`}
                  style={({ pressed }) => [styles.demoCard, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <View style={styles.demoText}>
                    <View style={styles.demoTitleRow}>
                      <Badge
                        label={account.label}
                        tone={
                          account.role === 'OWNER' ? 'violet' : account.role === 'HRD' ? 'info' : 'success'
                        }
                      />
                      {isAuthenticating ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
                    </View>
                    <AppText variant="caption" numberOfLines={1} style={{ marginTop: 4 }}>
                      {account.description}
                    </AppText>
                    <AppText style={styles.demoCredential}>
                      {account.email} · {account.password}
                    </AppText>
                  </View>
                  <ArrowRight size={16} color={colors.textMuted} strokeWidth={2.2} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <ShieldCheck size={14} color={colors.textOnDarkMuted} strokeWidth={2} />
            <AppText style={styles.footerText}>
              Mode demo lokal: data disimpan di memori aplikasi, tanpa backend. Autentikasi ini bukan
              keamanan produksi.
            </AppText>
          </View>
          <View style={styles.footerBadge}>
            <Sparkles size={12} color={colors.accent} strokeWidth={2.2} />
            <AppText style={styles.footerBadgeText}>Frontend demo · Expo SDK 58</AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  brandBlock: { alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...(shadows.floating as object),
  },
  brandName: { fontSize: 28, fontWeight: '700', color: colors.textOnDark, letterSpacing: -0.4 },
  brandTagline: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  brandChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center', marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...(shadows.floating as object),
  },
  cardHeader: { gap: 2 },
  form: { gap: spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  demoList: { gap: spacing.sm },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  demoText: { flex: 1 },
  demoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoCredential: { fontSize: 10.5, color: colors.textMuted, marginTop: 3 },
  footer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  footerText: { flex: 1, fontSize: 11, lineHeight: 16, color: colors.textOnDarkMuted },
  footerBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  footerBadgeText: { fontSize: 10.5, color: colors.textOnDarkMuted, fontWeight: '600' },
});
