import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { initials } from '../../utils/format';
import { AppText } from './AppText';

const PALETTES = [
  { background: '#DBEAFE', text: '#1D4ED8' },
  { background: '#D1FAE5', text: '#047857' },
  { background: '#FEF3C7', text: '#B45309' },
  { background: '#EDE9FE', text: '#6D28D9' },
  { background: '#FCE7F3', text: '#BE185D' },
  { background: '#E0F2FE', text: '#0369A1' },
] as const;

function paletteFor(name: string) {
  let total = 0;
  for (let index = 0; index < name.length; index += 1) total += name.charCodeAt(index);
  return PALETTES[total % PALETTES.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  tone?: 'auto' | 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

export function Avatar({ name, size = 44, tone = 'auto', style, showBorder = false }: AvatarProps) {
  const palette = paletteFor(name);
  const backgroundColor =
    tone === 'dark' ? 'rgba(248, 250, 252, 0.16)' : tone === 'light' ? colors.surfaceMuted : palette.background;
  const color = tone === 'dark' ? colors.textOnDark : tone === 'light' ? colors.textSecondary : palette.text;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderWidth: showBorder ? 2 : 0,
          borderColor: colors.white,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <AppText style={{ color, fontWeight: '700', fontSize: Math.max(11, Math.round(size * 0.36)) }}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
