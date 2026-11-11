import type { ReactNode } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { colors } from '../../theme';

type LabelProps = {
  children: ReactNode;
  size?: number;
  weight?: 'regular' | 'medium' | 'bold';
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Label({
  children,
  size = 15,
  weight = 'regular',
  color = colors.ink,
  style,
}: LabelProps) {
  const fontFamily =
    weight === 'bold'
      ? 'BeVietnamPro_700Bold'
      : weight === 'medium'
        ? 'BeVietnamPro_600SemiBold'
        : 'BeVietnamPro_400Regular';
  return (
    <Text
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.42), color, fontFamily }, style]}
    >
      {children}
    </Text>
  );
}
