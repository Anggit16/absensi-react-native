import { Check, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { BottomSheet } from './Modal';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SelectField({
  label,
  value,
  placeholder = 'Pilih opsi',
  options,
  onChange,
  error,
  helper,
  required,
  disabled,
  containerStyle,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="label">{label}</AppText>
          {required ? <AppText style={styles.required}>*</AppText> : null}
        </View>
      ) : null}
      <Pressable
        onPress={disabled ? undefined : () => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.fieldText}>
          <AppText
            variant={selected ? 'body' : 'body'}
            color={selected ? colors.text : colors.textMuted}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </AppText>
          {selected?.description ? (
            <AppText variant="caption" numberOfLines={1}>
              {selected.description}
            </AppText>
          ) : null}
        </View>
        <ChevronDown size={18} color={colors.textMuted} strokeWidth={2.2} />
      </Pressable>
      {error ? (
        <AppText style={styles.error}>{error}</AppText>
      ) : helper ? (
        <AppText style={styles.helper}>{helper}</AppText>
      ) : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Pilih opsi'}
        subtitle="Pilih salah satu opsi di bawah"
      >
        <ScrollView style={styles.optionList} showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.optionText}>
                  <AppText variant={active ? 'bodyStrong' : 'body'}>{option.label}</AppText>
                  {option.description ? (
                    <AppText variant="caption" style={{ marginTop: 2 }}>
                      {option.description}
                    </AppText>
                  ) : null}
                </View>
                {active ? <Check size={18} color={colors.accent} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  required: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.inputHeight,
  },
  fieldText: { flex: 1, gap: 1 },
  helper: { fontSize: 11, color: colors.textMuted },
  error: { fontSize: 11, color: colors.dangerDark, fontWeight: '600' },
  optionList: { maxHeight: 380 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSubtle },
  optionText: { flex: 1 },
});
