import { createStore } from '../../../shared/state/createStore';
import { defaultItinerary, initialItinerary } from '../data/demoItineraries';
import {
  cloneItinerary,
  createSavedItinerary,
  replaceOutdoorStop,
  updateItinerary,
} from '../models/itinerary';
import { reconcileRemoteItineraries } from '../models/itineraryReconciliation';
import type { BackendItineraryRead } from '../../../services/api/itineraryService';
import type { Itinerary, SyncStatus } from '../types';

export const DEFAULT_PREFERENCES = ['Di sản & văn hóa', 'Bảo tàng', 'Thiên nhiên'];

export function createItineraryRepository(initial?: Itinerary[]) {
  const store = createStore({
    itineraries: Array.isArray(initial) ? initial : [cloneItinerary(initialItinerary)],
    draft: cloneItinerary(defaultItinerary),
    editingId: null as string | null,
    selectedPreferences: [...DEFAULT_PREFERENCES],
    isRemoteRefreshing: false,
    remoteRefreshError: null as string | null,
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
        if (!found || found.syncStatus === 'pending') return false;
        store.update((state) => ({ ...state, editingId: id, draft: cloneItinerary(found) }));
        return true;
      },
      getItinerary(id: string): Itinerary | undefined {
        return store.getSnapshot().itineraries.find((item) => item.id === id);
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
      removeDraftStop(index: number): boolean {
        const { draft } = store.getSnapshot();
        if (draft.stops.length <= 1) return false;
        const newStops = draft.stops.filter((_, i) => i !== index);
        store.update((state) => ({
          ...state,
          draft: { ...state.draft, stops: newStops },
        }));
        return true;
      },
      deleteItinerary(id: string): boolean {
        const { itineraries } = store.getSnapshot();
        const exists = itineraries.some((item) => item.id === id);
        if (!exists) return false;
        store.update((state) => ({
          ...state,
          itineraries: state.itineraries.filter((item) => item.id !== id),
        }));
        return true;
      },
      restoreItinerary(itinerary: Itinerary, index?: number): boolean {
        const { itineraries } = store.getSnapshot();
        if (itineraries.some((item) => item.id === itinerary.id)) return false;
        if (
          typeof itinerary.remoteId === 'number' &&
          itineraries.some((item) => item.remoteId === itinerary.remoteId)
        ) {
          store.update((state) => ({
            ...state,
            itineraries: state.itineraries.map((item) =>
              item.remoteId === itinerary.remoteId
                ? { ...item, syncStatus: 'error' as SyncStatus }
                : item,
            ),
          }));
          return true;
        }
        const targetIndex =
          typeof index === 'number' && index >= 0 && index <= itineraries.length ? index : 0;
        const next = [...itineraries];
        next.splice(targetIndex, 0, cloneItinerary(itinerary));
        store.update((state) => ({
          ...state,
          itineraries: next,
        }));
        return true;
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
      attachRemoteMetadata(localId: string, remoteId: number, version: number): boolean {
        const { itineraries } = store.getSnapshot();
        const exists = itineraries.some((item) => item.id === localId);
        if (!exists) return false;
        store.update((state) => ({
          ...state,
          itineraries: state.itineraries.map((item) =>
            item.id === localId
              ? {
                  ...item,
                  remoteId,
                  version,
                  syncStatus: 'synced' as SyncStatus,
                }
              : item,
          ),
        }));
        return true;
      },
      updateSyncStatus(localId: string, status: SyncStatus): boolean {
        const { itineraries } = store.getSnapshot();
        const exists = itineraries.some((item) => item.id === localId);
        if (!exists) return false;
        store.update((state) => ({
          ...state,
          itineraries: state.itineraries.map((item) =>
            item.id === localId ? { ...item, syncStatus: status } : item,
          ),
        }));
        return true;
      },
      reconcileRemote(remoteItineraries: BackendItineraryRead[]) {
        const { itineraries } = store.getSnapshot();
        const result = reconcileRemoteItineraries(itineraries, remoteItineraries);
        store.update((state) => ({
          ...state,
          itineraries: result.reconciled,
          isRemoteRefreshing: false,
          remoteRefreshError: null,
        }));
        return result;
      },
      setRemoteRefreshing(isRefreshing: boolean) {
        store.update((state) => ({ ...state, isRemoteRefreshing: isRefreshing }));
      },
      setRemoteRefreshError(error: string | null) {
        store.update((state) => ({ ...state, remoteRefreshError: error }));
      },
      replaceItineraries(itineraries: Itinerary[]) {
        store.update((state) => ({
          ...state,
          itineraries: Array.isArray(itineraries) ? itineraries : [],
        }));
      },
      replaceItinerary(id: string, updated: Itinerary): boolean {
        const { itineraries } = store.getSnapshot();
        const exists = itineraries.some((item) => item.id === id);
        if (!exists) return false;
        store.update((state) => ({
          ...state,
          itineraries: state.itineraries.map((item) =>
            item.id === id ? cloneItinerary(updated) : item,
          ),
        }));
        return true;
      },
      clearItineraries() {
        store.update((state) => ({
          ...state,
          itineraries: [],
        }));
      },
    },
  };
}
