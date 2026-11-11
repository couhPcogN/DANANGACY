import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Card, Label } from '../../../components';
import { colors } from '../../../theme';
import type { StopView } from '../types';

type StopCardProps = { stop: StopView; onPress?: () => void; editing?: boolean };

export function StopCard({ stop, onPress, editing = false }: StopCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label size={12} weight="bold" color={colors.primaryDark}>
          {stop.start} – {stop.end}
          {editing ? ' · Khung giờ gợi ý' : ''}
        </Label>
        {onPress ? (
          <Ionicons
            name={editing ? 'create-outline' : 'ellipsis-horizontal'}
            size={19}
            color={colors.primaryDark}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 }}>
        <Ionicons name="location-outline" size={22} color={colors.ink} />
        <View>
          <Label size={14} weight="bold">
            {stop.name}
          </Label>
          <Label size={12} color={colors.muted}>
            {stop.description}
          </Label>
        </View>
      </View>
    </Card>
  );
}
