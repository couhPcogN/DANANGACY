import type { Trip } from '../../features/itinerary/types';
import { localStorage } from './localStorage';

export type SavedAppState = {
  signedIn: boolean;
  name: string;
  email: string;
  phone: string;
  favorites: string[];
  trips: Trip[];
  quizCompleted: boolean;
  quizAnswers: (number | null)[];
  points: number;
  rewardRedeemed: boolean;
};

// Keep the existing key and snapshot format so installed demos retain their data.
const STORAGE_KEY = 'danangacy.demo.v1';

export const appStateRepository = {
  load: () => localStorage.read<Partial<SavedAppState>>(STORAGE_KEY),
  save: (state: SavedAppState) => localStorage.write(STORAGE_KEY, state),
};
