import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '../../theme';
import { MONTHS_ID, WEEKDAY_INITIALS, buildCalendarMonth, formatDate, todayISO } from '../../utils/date';
import { AppText } from './AppText';
import { BottomSheet } from './Modal';

interface DateFieldProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  error,
  helper,
  required,
  minDate,
  maxDate,
  disabled,
  containerStyle,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const initial = value || todayISO();
  const [cursor, setCursor] = useState(() => ({
    year: Number(initial.slice(0, 4)),
    month: Number(initial.slice(5, 7)) - 1,
  }));

  useEffect(() => {
    if (open && value) {
      setCursor({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) - 1 });
    }
  }, [open, value]);

  const cells = useMemo(() => buildCalendarMonth(cursor.year, cursor.month), [cursor]);

  const shiftMonth = (direction: number) => {
    const date = new Date(cursor.year, cursor.month + direction, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

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
        accessibilityValue={{ text: value ? formatDate(value) : placeholder }}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Calendar size={18} color={colors.textMuted} strokeWidth={2} />
        <AppText variant="body" color={value ? colors.text : colors.textMuted} style={styles.flex}>
          {value ? formatDate(value) : placeholder}
        </AppText>
      </Pressable>
      {error ? (
        <AppText style={styles.error}>{error}</AppText>
      ) : helper ? (
        <AppText style={styles.helper}>{helper}</AppText>
      ) : null}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? 'Pilih tanggal'}
        subtitle="Kalender demo — tanpa sinkronisasi kalender perangkat"
      >
        <View style={styles.calendar}>
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              accessibilityLabel="Bulan sebelumnya"
              style={styles.calendarNav}
            >
              <ChevronLeft size={18} color={colors.primary} strokeWidth={2.4} />
            </Pressable>
            <AppText variant="subtitle">
              {MONTHS_ID[cursor.month]} {cursor.year}
            </AppText>
            <Pressable
              onPress={() => shiftMonth(1)}
              accessibilityLabel="Bulan berikutnya"
              style={styles.calendarNav}
            >
              <ChevronRight size={18} color={colors.primary} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_INITIALS.map((day, index) => (
              <AppText key={`${day}-${index}`} style={styles.weekday}>
                {day}
              </AppText>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell, index) => {
              if (!cell) return <View key={`empty-${index}`} style={styles.cell} />;
              const isSelected = cell === value;
              const isToday = cell === todayISO();
              const isDisabled =
                (minDate !== undefined && cell < minDate) || (maxDate !== undefined && cell > maxDate);

              return (
                <Pressable
                  key={cell}
                  disabled={isDisabled}
                  onPress={() => {
                    onChange(cell);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(cell)}
                  accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                  style={({ pressed }) => [
                    styles.cell,
                    isSelected && styles.cellSelected,
                    !isSelected && isToday && styles.cellToday,
                    { opacity: pressed ? 0.6 : isDisabled ? 0.3 : 1 },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected || isToday ? '700' : '500',
                      color: isSelected ? colors.white : isDisabled ? colors.textMuted : colors.text,
                    }}
                  >
                    {Number(cell.slice(8, 10))}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.quickRow}>
            <Pressable
              onPress={() => {
                onChange(todayISO());
                setOpen(false);
              }}
              style={styles.quickButton}
            >
              <AppText style={styles.quickText}>Hari ini</AppText>
            </Pressable>
            {value ? (
              <AppText variant="caption" style={styles.selectedText}>
                Dipilih: {formatDate(value)}
              </AppText>
            ) : null}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  flex: { flex: 1 },
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
  helper: { fontSize: 11, color: colors.textMuted },
  error: { fontSize: 11, color: colors.dangerDark, fontWeight: '600' },
  calendar: { gap: spacing.sm },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginTop: spacing.sm },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  cellSelected: { backgroundColor: colors.primary },
  cellToday: { backgroundColor: colors.accentSubtle },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  quickButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  quickText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  selectedText: { color: colors.textMuted },
});
