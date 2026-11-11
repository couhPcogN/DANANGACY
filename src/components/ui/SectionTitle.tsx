import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, space } from '../../theme';

import { Label } from '../ui/Label';

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitle}><Label size={16} weight="bold">{title}</Label>{action && onAction ? <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}><Label size={13} color={colors.primaryDark}>{action}</Label></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
});
