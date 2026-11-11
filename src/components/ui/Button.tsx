import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

import type { IconName } from '../ui/types';
import { Label } from '../ui/Label';

export function Button({ title, onPress, kind = 'primary', icon, disabled = false, style }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline'; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const background = disabled ? colors.disabled : kind === 'primary' ? colors.primary : kind === 'secondary' ? colors.warm : colors.white;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} hitSlop={4} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: background, borderWidth: kind === 'outline' ? 1 : 0, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }, style]}>
    {icon ? <Ionicons name={icon} size={19} color={kind === 'secondary' ? colors.primaryDark : colors.ink} style={{ marginRight: 8 }} /> : null}
    <Label weight="bold" size={15} color={disabled ? colors.muted : kind === 'secondary' ? colors.primaryDark : colors.ink}>{title}</Label>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 16 },
});
