import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from './Label';

type PillProps = {
  title: string;
  selected?: boolean;
  tone?: 'orange' | 'green' | 'blue' | 'gray';
  onPress?: () => void;
};

const tagColors = {
  green: { background: colors.successBg, foreground: colors.success },
  blue: { background: colors.infoBg, foreground: colors.info },
  gray: { background: colors.subtle, foreground: colors.muted },
};

export function Pill({ title, selected = false, tone = 'orange', onPress }: PillProps) {
  const isTag = tone !== 'orange';
  const palette =
    tone === 'orange'
      ? {
          background: selected ? colors.warm : colors.white,
          foreground: selected ? colors.primaryDark : colors.ink,
        }
      : tagColors[tone];
  const { background, foreground } = palette;
  const body = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: background,
          borderColor: isTag ? background : selected ? colors.primary : colors.border,
          paddingVertical: isTag ? 3 : 7,
          paddingHorizontal: isTag ? 9 : 11,
        },
      ]}
    >
      <Label
        size={isTag ? 12 : 13}
        weight={selected || isTag ? 'medium' : 'regular'}
        color={foreground}
      >
        {title}
      </Label>
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }}
      onPress={onPress}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
});
