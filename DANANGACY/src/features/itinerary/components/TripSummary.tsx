import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Label } from '../../../components';
import { colors } from '../../../theme';
import type { Trip } from '../types';

type TripSummaryProps = { trip: Trip };

export function TripSummary({ trip }: TripSummaryProps) {
  return (
    <>
      <Label size={21} weight="bold" style={{ marginBottom: 14 }}>
        {trip.title}
      </Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Ionicons name="calendar-outline" size={21} color={colors.ink} />
        <View>
          <Label size={14} weight="medium">
            {trip.date} · {trip.duration} ngày
          </Label>
          <Label size={12} color={colors.muted}>
            {trip.stops.length} điểm đến · Nhịp độ {trip.pace.toLowerCase()}
          </Label>
        </View>
      </View>
    </>
  );
}
