import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Label } from '../../../components';
import { colors } from '../../../theme';
import type { Itinerary } from '../types';

type ItinerarySummaryProps = { itinerary: Itinerary };

export function ItinerarySummary({ itinerary }: ItinerarySummaryProps) {
  return (
    <>
      <Label size={21} weight="bold" style={{ marginBottom: 14 }}>
        {itinerary.title}
      </Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Ionicons name="calendar-outline" size={21} color={colors.ink} />
        <View>
          <Label size={14} weight="medium">
            {itinerary.date} · {itinerary.duration} ngày
          </Label>
          <Label size={12} color={colors.muted}>
            {itinerary.stops.length} điểm đến · Nhịp độ {itinerary.pace.toLowerCase()}
          </Label>
        </View>
      </View>
    </>
  );
}
