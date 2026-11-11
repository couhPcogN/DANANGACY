import { createStore } from '../../../lib/state/createStore';
import { defaultItinerary, initialItinerary } from '../data/demoItineraries';
import {
  cloneItinerary,
  createSavedItinerary,
  replaceOutdoorStop,
  updateItinerary,
} from '../models/itinerary';
import type { Itinerary } from '../types';

export function createItineraryRepository(initial?: Itinerary[]) {
  const store = createStore({
    itineraries: Array.isArray(initial) ? initial : [cloneItinerary(initialItinerary)],
    draft: cloneItinerary(defaultItinerary),
    editingId: null as string | null,
  });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      setDraft: (draft: Itinerary) => store.update((state) => ({ ...state, draft })),
      startCreate() {
        store.update((state) => ({
          ...state,
          editingId: null,
          draft: cloneItinerary(defaultItinerary),
        }));
      },
      saveDraft(): Itinerary {
        const saved = createSavedItinerary(store.getSnapshot().draft);
        store.update((state) => ({
          ...state,
          itineraries: [saved, ...state.itineraries],
          draft: saved,
        }));
        return saved;
      },
      startEdit(id: string): boolean {
        const found = store.getSnapshot().itineraries.find((item) => item.id === id);
        if (!found) return false;
        store.update((state) => ({ ...state, editingId: id, draft: cloneItinerary(found) }));
        return true;
      },
      saveEdit(): string | null {
        const { editingId, draft } = store.getSnapshot();
        if (!editingId) return null;
        store.update((state) => ({
          ...state,
          itineraries: updateItinerary(state.itineraries, editingId, draft),
        }));
        return editingId;
      },
      replaceSonTra(id?: string): string | null {
        const { itineraries } = store.getSnapshot();
        const found =
          itineraries.find((item) => item.id === id) ??
          itineraries.find((item) => item.id !== 'hoi-an');
        if (!found) return null;
        store.update((state) => ({
          ...state,
          itineraries: replaceOutdoorStop(state.itineraries, found.id),
        }));
        return found.id;
      },
    },
  };
}
