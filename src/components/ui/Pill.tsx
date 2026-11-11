import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from '../ui/Label';

export function Pill({ title, selected = false, tone = 'orange', onPress }: { title: string; selected?: boolean; tone?: 'orange' | 'green' | 'blue' | 'gray'; onPress?: () => void }) {
  const isTag = tone !== 'orange';
  const background = isTag ? tone === 'green' ? colors.successBg : tone === 'blue' ? colors.infoBg : colors.subtle : selected ? colors.warm : colors.white;
  const foreground = isTag ? tone === 'green' ? colors.success : tone === 'blue' ? colors.info : colors.muted : selected ? colors.primaryDark : colors.ink;
  const body = <View style={[styles.pill, { backgroundColor: background, borderColor: isTag ? background : selected ? colors.primary : colors.border, paddingVertical: isTag ? 3 : 7, paddingHorizontal: isTag ? 9 : 11 }]}><Label size={isTag ? 12 : 13} weight={selected || isTag ? 'medium' : 'regular'} color={foreground}>{title}</Label></View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ selected }} hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }} onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7, alignSelf: 'flex-start' },
});
