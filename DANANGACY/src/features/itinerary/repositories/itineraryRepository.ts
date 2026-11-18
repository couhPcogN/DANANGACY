import { createStore } from '../../../shared/state/createStore';
import { defaultItinerary, initialItinerary } from '../data/demoItineraries';
import {
  cloneItinerary,
  createSavedItinerary,
  replaceOutdoorStop,
  updateItinerary,
} from '../models/itinerary';
import type { Itinerary } from '../types';

export const DEFAULT_PREFERENCES = ['Di sản & văn hóa', 'Bảo tàng', 'Thiên nhiên'];

export function createItineraryRepository(initial?: Itinerary[]) {
  const store = createStore({
    itineraries: Array.isArray(initial) ? initial : [cloneItinerary(initialItinerary)],
    draft: cloneItinerary(defaultItinerary),
    editingId: null as string | null,
    selectedPreferences: [...DEFAULT_PREFERENCES],
  });
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    actions: {
      setDraft: (draft: Itinerary) => store.update((state) => ({ ...state, draft })),
      setPreferences(preferences: string[]) {
        store.update((state) => ({ ...state, selectedPreferences: [...preferences] }));
      },
      togglePreference(preference: string) {
        store.update((state) => ({
          ...state,
          selectedPreferences: state.selectedPreferences.includes(preference)
            ? state.selectedPreferences.filter((item) => item !== preference)
            : [...state.selectedPreferences, preference],
        }));
      },
      resetPreferences() {
        store.update((state) => ({ ...state, selectedPreferences: [...DEFAULT_PREFERENCES] }));
      },
      startCreate() {
        store.update((state) => ({
          ...state,
          editingId: null,
          draft: cloneItinerary(defaultItinerary),
          selectedPreferences: [...DEFAULT_PREFERENCES],
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
