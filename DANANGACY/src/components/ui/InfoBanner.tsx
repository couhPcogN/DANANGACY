import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from './Label';
import type { IconName } from './types';

type InfoBannerProps = { children: ReactNode; tone?: 'orange' | 'blue' | 'green'; icon?: IconName };

const toneColors = {
  orange: { background: colors.warm, foreground: colors.primaryDark },
  blue: { background: colors.infoBg, foreground: colors.info },
  green: { background: colors.successBg, foreground: colors.success },
};

export function InfoBanner({
  children,
  tone = 'orange',
  icon = 'information-circle-outline',
}: InfoBannerProps) {
  const { background, foreground } = toneColors[tone];
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: background,
          borderColor: tone === 'orange' ? colors.warmBorder : background,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={foreground}
        style={{ marginRight: 10, marginTop: 1 }}
      />
      <Label size={13} color={foreground} style={{ flex: 1 }}>
        {children}
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    flexDirection: 'row',
    marginVertical: 8,
  },
});
