import type { Itinerary } from '../../features/itinerary/types';
import { localStorage } from './localStorage';

export type SavedAppState = {
  signedIn: boolean;
  name: string;
  email: string;
  phone: string;
  favorites: string[];
  itineraries: Itinerary[];
  quizCompleted: boolean;
  quizAnswers: (number | null)[];
  points: number;
  rewardRedeemed: boolean;
};

// Keep the storage key; migrate the former field name when loading an installed demo.
const STORAGE_KEY = 'danangacy.demo.v1';

type StoredAppState = Partial<SavedAppState> & { trips?: Itinerary[] };

export const appStateRepository = {
  async load(): Promise<Partial<SavedAppState> | null> {
    const saved = await localStorage.read<StoredAppState>(STORAGE_KEY);
    if (!saved) return null;
    const { trips: legacyItineraries, ...state } = saved;
    return {
      ...state,
      itineraries: Array.isArray(state.itineraries) ? state.itineraries : legacyItineraries,
    };
  },
  save: (state: SavedAppState) => localStorage.write(STORAGE_KEY, state),
};
