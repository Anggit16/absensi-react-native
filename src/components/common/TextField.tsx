import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontSize, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: LucideIcon;
  prefix?: string;
  required?: boolean;
  secureToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
}

export function TextField({
  label,
  error,
  helper,
  leftIcon: LeftIcon,
  prefix,
  required,
  secureToggle,
  containerStyle,
  inputStyle,
  multiline,
  editable = true,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureToggle));

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="label">{label}</AppText>
          {required ? <AppText style={styles.required}>*</AppText> : null}
        </View>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: editable ? colors.surface : colors.surfaceMuted,
            alignItems: multiline ? 'flex-start' : 'center',
          },
          multiline && styles.multilineWrapper,
        ]}
      >
        {LeftIcon ? (
          <LeftIcon size={18} color={focused ? colors.primary : colors.textMuted} strokeWidth={2} />
        ) : null}
        {prefix ? <AppText style={styles.prefix}>{prefix}</AppText> : null}
        <TextInput
          {...rest}
          editable={editable}
          multiline={multiline}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan password' : 'Sembunyikan password'}
            hitSlop={8}
          >
            {hidden ? (
              <EyeOff size={18} color={colors.textMuted} strokeWidth={2} />
            ) : (
              <Eye size={18} color={colors.textMuted} strokeWidth={2} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText style={styles.error}>{error}</AppText>
      ) : helper ? (
        <AppText style={styles.helper}>{helper}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  required: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  inputWrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.inputHeight,
    backgroundColor: colors.surface,
  },
  multilineWrapper: { paddingVertical: spacing.md, minHeight: 96 },
  prefix: { fontSize: fontSize.body, fontWeight: '700', color: colors.textSecondary },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: 12,
  },
  multilineInput: { textAlignVertical: 'top', minHeight: 72, paddingVertical: 0 },
  helper: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  error: { fontSize: 11, color: colors.dangerDark, lineHeight: 15, fontWeight: '600' },
});
