import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from './Label';
import type { IconName } from './types';

type ButtonProps = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'outline';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const backgrounds = {
  primary: colors.primary,
  secondary: colors.warm,
  outline: colors.white,
};

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled = false,
  style,
}: ButtonProps) {
  const background = disabled ? colors.disabled : backgrounds[kind];
  const iconColor = kind === 'secondary' ? colors.primaryDark : colors.ink;
  const textColor = disabled ? colors.muted : iconColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderWidth: kind === 'outline' ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={19} color={iconColor} style={{ marginRight: 8 }} />
      ) : null}
      <Label weight="bold" size={15} color={textColor}>
        {title}
      </Label>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
});
