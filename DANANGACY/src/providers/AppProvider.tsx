import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuthModel } from '../features/auth/providers/AuthProvider';
import {
  FavoritesProvider,
  useFavoritesModel,
} from '../features/explore/providers/FavoritesProvider';
import { GameProvider, useGameModel } from '../features/game/providers/GameProvider';
import {
  ItineraryProvider,
  useItineraryModel,
} from '../features/itinerary/providers/ItineraryProvider';
import { ProfileProvider, useProfileModel } from '../features/profile/providers/ProfileProvider';
import { appStateRepository } from '../lib/storage/appStateRepository';
import type { SavedAppState } from '../lib/storage/appStateRepository';
import { NavigationProvider } from '../navigation/NavigationProvider';

function PersistLocalState({ children }: { children: ReactNode }) {
  const { signedIn } = useAuthModel();
  const { name, email, phone } = useProfileModel();
  const { favorites } = useFavoritesModel();
  const { itineraries } = useItineraryModel();
  const { quizCompleted, quizAnswers, points, rewardRedeemed } = useGameModel();

  useEffect(() => {
    const timer = setTimeout(() => {
      appStateRepository
        .save({
          signedIn,
          name,
          email,
          phone,
          favorites,
          itineraries,
          quizCompleted,
          quizAnswers,
          points,
          rewardRedeemed,
        })
        .catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, [
    signedIn,
    name,
    email,
    phone,
    favorites,
    itineraries,
    quizCompleted,
    quizAnswers,
    points,
    rewardRedeemed,
  ]);

  return children;
}

// Composition and persistence only. Each feature owns its repository and model state.
export function AppProvider({ children }: { children: ReactNode }) {
  const [initial, setInitial] = useState<Partial<SavedAppState> | null>(null);
  useEffect(() => {
    let active = true;
    appStateRepository
      .load()
      .then((saved) => {
        if (active) setInitial(saved ?? {});
      })
      .catch(() => {
        if (active) setInitial({});
      });
    return () => {
      active = false;
    };
  }, []);
  if (!initial) return null;

  return (
    <NavigationProvider initialState={{ name: initial.signedIn === true ? 'home' : 'welcome' }}>
      <AuthProvider initialState={initial.signedIn}>
        <ProfileProvider initialState={initial}>
          <FavoritesProvider initialState={initial.favorites}>
            <ItineraryProvider initialState={initial.itineraries}>
              <GameProvider initialState={initial}>
                <PersistLocalState>{children}</PersistLocalState>
              </GameProvider>
            </ItineraryProvider>
          </FavoritesProvider>
        </ProfileProvider>
      </AuthProvider>
    </NavigationProvider>
  );
}
