import type { ComponentProps } from 'react';
import type { Stop, StopView } from '../types';
import { StopCard } from './StopCard';
import { TimeEditor } from './TimeEditor';

type ItineraryStopsEditorProps = {
  stops: StopView[];
  onEdit: (index: number, stop: Stop) => void;
  onRemove?: (index: number) => void;
  editing: boolean;
  timeEditor: ComponentProps<typeof TimeEditor>;
};

export function ItineraryStopsEditor({
  stops,
  onEdit,
  onRemove,
  editing,
  timeEditor,
}: ItineraryStopsEditorProps) {
  return (
    <>
      {stops.map((stop, index) => (
        <StopCard
          key={`${stop.placeId}-${index}`}
          stop={stop}
          editing
          onPress={() => onEdit(index, stop)}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
      {editing ? <TimeEditor {...timeEditor} /> : null}
    </>
  );
}
