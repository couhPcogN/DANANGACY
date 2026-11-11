import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from '../features/auth/viewmodels/useAuthState';
import { useFavoritesState } from '../features/explore/viewmodels/useFavoritesState';
import { quiz } from '../features/game/repositories/gameRepository';
import { useGameState } from '../features/game/viewmodels/useGameState';
import type { Trip } from '../features/itinerary/types';
import { useItineraryState } from '../features/itinerary/viewmodels/useItineraryState';
import { useProfileState } from '../features/profile/viewmodels/useProfileState';
import { appStateRepository } from '../lib/storage/appStateRepository';
import type { Route, RouteName, TabName } from '../navigation/types';
import { useNavigationState } from '../navigation/useNavigationState';
import { notify } from '../utils/notify';

type AppContextValue = {
  route: Route;
  signedIn: boolean;
  name: string;
  email: string;
  phone: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  login: () => void;
  logout: () => void;
  navigate: (name: RouteName, id?: string) => void;
  back: () => void;
  tab: (name: TabName) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  trips: Trip[];
  draft: Trip;
  setDraft: (trip: Trip) => void;
  startCreate: () => void;
  saveDraft: () => void;
  startEdit: (id: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  replaceSonTra: () => void;
  quizIndex: number;
  quizSelected: number | null;
  quizAnswers: (number | null)[];
  quizConfirmed: boolean;
  quizCompleted: boolean;
  points: number;
  startQuiz: () => void;
  selectAnswer: (index: number) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  rewardRedeemed: boolean;
  redeemReward: () => void;
  notify: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// Compose shared feature state and hydrate the existing demo snapshot once.
export function AppProvider({ children }: { children: ReactNode }) {
  const { route, navigate, back, tab, reset } = useNavigationState();
  const { signedIn, setSignedIn, login, logout } = useAuthState(tab, reset);
  const { name, setName, email, setEmail, phone, setPhone } = useProfileState();
  const { favorites, setFavorites, toggleFavorite } = useFavoritesState();
  const {
    trips,
    setTrips,
    draft,
    setDraft,
    startCreate,
    saveDraft,
    startEdit,
    saveEdit,
    cancelEdit,
    replaceSonTra,
  } = useItineraryState(route, navigate, reset);
  const {
    quizIndex,
    quizSelected,
    quizAnswers,
    setQuizAnswers,
    quizConfirmed,
    quizCompleted,
    setQuizCompleted,
    points,
    setPoints,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    rewardRedeemed,
    setRewardRedeemed,
    redeemReward,
  } = useGameState(navigate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    appStateRepository
      .load()
      .then((saved) => {
        if (!active || !saved) return;
        if (typeof saved.name === 'string') setName(saved.name);
        if (typeof saved.email === 'string') setEmail(saved.email);
        if (typeof saved.phone === 'string') setPhone(saved.phone);
        if (Array.isArray(saved.favorites))
          setFavorites(saved.favorites.filter((id: unknown) => typeof id === 'string'));
        if (Array.isArray(saved.trips)) setTrips(saved.trips);
        if (typeof saved.quizCompleted === 'boolean') setQuizCompleted(saved.quizCompleted);
        if (Array.isArray(saved.quizAnswers) && saved.quizAnswers.length === quiz.length)
          setQuizAnswers(saved.quizAnswers);
        if (typeof saved.points === 'number') setPoints(saved.points);
        if (typeof saved.rewardRedeemed === 'boolean') setRewardRedeemed(saved.rewardRedeemed);
        if (saved.signedIn === true) {
          setSignedIn(true);
          reset({ name: 'home' });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      appStateRepository
        .save({
          signedIn,
          name,
          email,
          phone,
          favorites,
          trips,
          quizCompleted,
          quizAnswers,
          points,
          rewardRedeemed,
        })
        .catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    signedIn,
    name,
    email,
    phone,
    favorites,
    trips,
    quizCompleted,
    quizAnswers,
    points,
    rewardRedeemed,
  ]);

  if (!hydrated) return null;
  return (
    <AppContext.Provider
      value={{
        route,
        signedIn,
        name,
        email,
        phone,
        setName,
        setEmail,
        setPhone,
        login,
        logout,
        navigate,
        back,
        tab,
        favorites,
        toggleFavorite,
        trips,
        draft,
        setDraft,
        startCreate,
        saveDraft,
        startEdit,
        saveEdit,
        cancelEdit,
        replaceSonTra,
        quizIndex,
        quizSelected,
        quizAnswers,
        quizConfirmed,
        quizCompleted,
        points,
        startQuiz,
        selectAnswer,
        confirmAnswer,
        nextQuestion,
        rewardRedeemed,
        redeemReward,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
