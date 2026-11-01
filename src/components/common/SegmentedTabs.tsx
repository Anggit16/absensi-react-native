import React from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export interface SegmentOption {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedTabsProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}

export function SegmentedTabs({ options, value, onChange, style, scrollable = false }: SegmentedTabsProps) {
  const content = (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <AppText
              numberOfLines={1}
              style={{
                fontSize: 12.5,
                fontWeight: active ? '700' : '600',
                color: active ? colors.white : colors.textSecondary,
              }}
            >
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : ''}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return content;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {content}
    </ScrollView>
  );
}

interface FilterChipsProps {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterChips({ options, value, onChange, style }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipRow, style]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <AppText
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: active ? colors.white : colors.textSecondary,
              }}
            >
              {option.label}
              {option.count !== undefined ? ` · ${option.count}` : ''}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: radius.md,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  scrollContent: { flexGrow: 1 },
  chipRow: { gap: spacing.sm, paddingVertical: 2, paddingRight: spacing.lg },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
