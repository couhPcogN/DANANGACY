import React from 'react';
import { StyleProp, Text } from 'react-native';
import { colors } from '../../theme';


export function Label({ children, size = 15, weight = 'regular', color = colors.ink, style }: { children: React.ReactNode; size?: number; weight?: 'regular' | 'medium' | 'bold'; color?: string; style?: StyleProp<any> }) {
  const fontFamily = weight === 'bold' ? 'BeVietnamPro_700Bold' : weight === 'medium' ? 'BeVietnamPro_600SemiBold' : 'BeVietnamPro_400Regular';
  return <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.42), color, fontFamily }, style]}>{children}</Text>;
}
