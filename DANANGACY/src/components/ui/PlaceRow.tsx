import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import type { Place } from '../../features/explore/types';

import type { IconName } from '../ui/types';
import { Card } from '../ui/Card';
import { PlacePhoto } from '../ui/PlacePhoto';
import { Label } from '../ui/Label';
import { Pill } from '../ui/Pill';

export function PlaceRow({ place, onPress, selected = false, trailing = 'chevron-forward', small = false }: { place: Place; onPress: () => void; selected?: boolean; trailing?: IconName; small?: boolean }) {
  return <Card onPress={onPress} style={[styles.placeRow, selected && { borderColor: colors.primary }]}><View style={{ width: small ? 68 : 100, height: small ? 68 : 100, marginRight: 12 }}><PlacePhoto source={place.image} name={place.name} height={small ? 68 : 100} /></View><View style={{ flex: 1, justifyContent: 'center' }}><Label size={14} weight="bold">{place.name}</Label>{!small ? <Label size={12} color={colors.muted} style={{ marginTop: 4 }}>{place.area}</Label> : null}<View style={{ alignSelf: 'flex-start', marginTop: 6 }}><Pill title={place.category} tone={place.category === 'Trong nhà' ? 'green' : 'blue'} /></View></View><Ionicons name={trailing} size={19} color={colors.primaryDark} /></Card>;
}

const styles = StyleSheet.create({
  placeRow: { flexDirection: 'row', alignItems: 'center' },
});
