import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

import type { IconName } from '../ui/types';
import { Label } from '../ui/Label';

export function Header({ title, subtitle, onBack, action, actionIcon }: { title: string; subtitle?: string; onBack?: () => void; action?: () => void; actionIcon?: IconName }) {
  return <View style={styles.header}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={{ left: 8, right: 8 }} onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable> : null}
      <View style={{ flex: 1 }}><Label size={21} weight="bold">{title}</Label>{subtitle ? <Label size={12} color={colors.muted}>{subtitle}</Label> : null}</View>
    </View>
    {action && actionIcon ? <Pressable accessibilityRole="button" hitSlop={4} onPress={action} style={styles.iconButton}><Ionicons name={actionIcon} size={21} color={colors.primaryDark} /></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { width: 28, height: 44, justifyContent: 'center', marginRight: 4 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warm },
});
