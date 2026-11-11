import type { ComponentProps } from 'react';
import type { Stop } from '../types';
import { StopCard } from './StopCard';
import { TimeEditor } from './TimeEditor';

type TripStopsEditorProps = {
  stops: Stop[];
  onEdit: (index: number, stop: Stop) => void;
  editing: boolean;
  timeEditor: ComponentProps<typeof TimeEditor>;
};

export function TripStopsEditor({ stops, onEdit, editing, timeEditor }: TripStopsEditorProps) {
  return (
    <>
      {stops.map((stop, index) => (
        <StopCard
          key={`${stop.placeId}-${index}`}
          stop={stop}
          editing
          onPress={() => onEdit(index, stop)}
        />
      ))}
      {editing ? <TimeEditor {...timeEditor} /> : null}
    </>
  );
}
