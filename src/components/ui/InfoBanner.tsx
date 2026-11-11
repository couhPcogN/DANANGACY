import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

import type { IconName } from '../ui/types';
import { Label } from '../ui/Label';

export function InfoBanner({ children, tone = 'orange', icon = 'information-circle-outline' }: { children: React.ReactNode; tone?: 'orange' | 'blue' | 'green'; icon?: IconName }) {
  const bg = tone === 'blue' ? colors.infoBg : tone === 'green' ? colors.successBg : colors.warm;
  const fg = tone === 'blue' ? colors.info : tone === 'green' ? colors.success : colors.primaryDark;
  return <View style={[styles.banner, { backgroundColor: bg, borderColor: tone === 'orange' ? colors.warmBorder : bg }]}><Ionicons name={icon} size={19} color={fg} style={{ marginRight: 10, marginTop: 1 }} /><Label size={13} color={fg} style={{ flex: 1 }}>{children}</Label></View>;
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: radius.md, padding: 12, flexDirection: 'row', marginVertical: 8 },
});
