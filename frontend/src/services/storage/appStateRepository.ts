import type { AuthUser } from '../../features/auth/types';
import type { Itinerary } from '../../features/itinerary/types';
import { localStorage } from './localStorage';

export type SavedAppState = {
  signedIn: boolean;
  token?: string | null;
  user?: AuthUser | null;
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
    const migratedItineraries = (
      Array.isArray(state.itineraries) ? state.itineraries : legacyItineraries
    )?.map((itinerary) => ({
      ...itinerary,
      duration: itinerary.duration >= 1 && itinerary.duration <= 3 ? itinerary.duration : 1,
      stops: itinerary.stops.map((stop) => ({
        ...stop,
        dayIndex: stop.dayIndex && stop.dayIndex >= 1 && stop.dayIndex <= 3 ? stop.dayIndex : 1,
      })),
    }));
    return {
      ...state,
      itineraries: migratedItineraries,
    };
  },
  save: (state: SavedAppState) => localStorage.write(STORAGE_KEY, state),
};
