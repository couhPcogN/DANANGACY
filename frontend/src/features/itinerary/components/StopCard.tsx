import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Card, Label } from '../../../shared/components';
import { colors } from '../../../theme';
import type { StopView } from '../types';

type StopCardProps = {
  stop: StopView;
  onPress?: () => void;
  editing?: boolean;
  onRemove?: () => void;
};

export function StopCard({ stop, onPress, editing = false, onRemove }: StopCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label size={12} weight="bold" color={colors.primaryDark}>
          {stop.start} – {stop.end}
          {editing ? ' · Khung giờ gợi ý' : ''}
        </Label>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {onPress ? (
            <Ionicons
              name={editing ? 'create-outline' : 'ellipsis-horizontal'}
              size={19}
              color={colors.primaryDark}
            />
          ) : null}
          {onRemove ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onRemove();
              }}
              hitSlop={8}
              style={{ padding: 2 }}
            >
              <Ionicons name="trash-outline" size={19} color={colors.error} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 }}>
        <Ionicons name="location-outline" size={22} color={colors.ink} />
        <View style={{ flex: 1 }}>
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
