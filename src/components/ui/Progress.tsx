import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';


export function Progress({ step, total, compact = false }: { step: number; total: number; compact?: boolean }) {
  return <View style={{ flexDirection: 'row', gap: 4, marginVertical: compact ? 3 : 8 }}>{Array.from({ length: total }, (_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 4, backgroundColor: i < step ? colors.primary : colors.disabled }} />)}</View>;
}
