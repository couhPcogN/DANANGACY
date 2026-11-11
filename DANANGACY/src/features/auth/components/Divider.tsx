import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { Label } from '../../../components';

export function Divider() { return <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 }}><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /><Label size={13} color={colors.muted}>Hoặc</Label><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /></View>; }
