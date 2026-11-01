import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { colors, textStyles } from '../../theme';

type Variant = keyof typeof textStyles;

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function AppText({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        textStyles[variant],
        color ? { color } : null,
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, ...rest }: AppTextProps) {
  return (
    <AppText variant="small" {...rest} style={style}>
      {children}
    </AppText>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <AppText
      variant="caption"
      style={[
        {
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.textMuted,
          fontWeight: '700',
        },
        style,
      ]}
    >
      {children}
    </AppText>
  );
}
