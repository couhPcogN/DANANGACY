import type { ComponentType } from 'react';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { GameScreen } from '../features/game/screens/GameScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ItineraryScreen } from '../features/itinerary/screens/ItineraryScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useApp } from '../providers/AppProvider';
import type { RouteName } from './types';

const routeScreens: Record<RouteName, ComponentType> = {
  welcome: AuthScreen,
  login: AuthScreen,
  register: AuthScreen,
  forgot: AuthScreen,
  verify: AuthScreen,
  reset: AuthScreen,
  home: HomeScreen,
  explore: ExploreScreen,
  map: ExploreScreen,
  place: ExploreScreen,
  itinerary: ItineraryScreen,
  tripInfo: ItineraryScreen,
  tripPreferences: ItineraryScreen,
  tripPlaces: ItineraryScreen,
  tripReview: ItineraryScreen,
  tripSaved: ItineraryScreen,
  tripDetail: ItineraryScreen,
  tripEdit: ItineraryScreen,
  tripEditPlaces: ItineraryScreen,
  weather: ItineraryScreen,
  replacement: ItineraryScreen,
  replacementConfirm: ItineraryScreen,
  game: GameScreen,
  gameIntro: GameScreen,
  quiz: GameScreen,
  quizResult: GameScreen,
  quizAnswers: GameScreen,
  rewards: GameScreen,
  rewardDetail: GameScreen,
  redeemed: GameScreen,
  myRewards: GameScreen,
  profile: ProfileScreen,
  editProfile: ProfileScreen,
  favorites: ProfileScreen,
};

export function AppNavigator() {
  const { route } = useApp();
  const Screen = routeScreens[route.name];
  return <Screen />;
}
