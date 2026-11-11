import type { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

type CardProps = { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void };

export function Card({ children, style, onPress }: CardProps) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 12,
  },
});
