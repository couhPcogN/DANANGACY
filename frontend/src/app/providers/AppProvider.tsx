import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuthModel } from '../../features/auth/providers/AuthProvider';
import {
  FavoritesProvider,
  useFavoritesModel,
} from '../../features/explore/providers/FavoritesProvider';
import { GameProvider, useGameModel } from '../../features/game/providers/GameProvider';
import {
  ItineraryProvider,
  useItineraryModel,
} from '../../features/itinerary/providers/ItineraryProvider';
import { ProfileProvider, useProfileModel } from '../../features/profile/providers/ProfileProvider';
import { appStateRepository } from '../../services/storage/appStateRepository';
import type { SavedAppState } from '../../services/storage/appStateRepository';
import { NavigationProvider } from '../navigation/NavigationProvider';

function PersistLocalState({ children }: { children: ReactNode }) {
  const { signedIn, token, user } = useAuthModel();
  const { name, email, phone } = useProfileModel();
  const { favorites } = useFavoritesModel();
  const { itineraries } = useItineraryModel();
  const { quizCompleted, quizAnswers, points, rewardRedeemed } = useGameModel();

  useEffect(() => {
    const timer = setTimeout(() => {
      appStateRepository
        .save({
          signedIn,
          token,
          user,
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
    token,
    user,
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

  const isActuallySignedIn = Boolean(initial.signedIn === true && initial.token);
  const authInitialState = {
    signedIn: isActuallySignedIn,
    token: isActuallySignedIn ? (initial.token ?? null) : null,
    user: isActuallySignedIn ? (initial.user ?? null) : null,
  };
  const profileInitialState = {
    ...initial,
    name: isActuallySignedIn && initial.name ? initial.name : 'Khách tham quan',
    email: isActuallySignedIn && initial.email ? initial.email : '',
  };

  return (
    <NavigationProvider initialState={{ name: 'home' }}>
      <AuthProvider initialState={authInitialState}>
        <ProfileProvider initialState={profileInitialState}>
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
