import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Button, Label, Screen as AppScreen } from '../../shared/components';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { ExploreScreen } from '../../features/explore/screens/ExploreScreen';
import { GameScreen } from '../../features/game/screens/GameScreen';
import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { ItineraryScreen } from '../../features/itinerary/screens/ItineraryScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { useNavigationViewModel } from './NavigationProvider';
import { isRouteName } from './types';
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
  itineraryInfo: ItineraryScreen,
  itineraryPreferences: ItineraryScreen,
  itineraryPlaces: ItineraryScreen,
  itineraryReview: ItineraryScreen,
  itinerarySaved: ItineraryScreen,
  itineraryDetail: ItineraryScreen,
  itineraryEdit: ItineraryScreen,
  itineraryEditPlaces: ItineraryScreen,
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
  const { route, back, tab, canGoBack } = useNavigationViewModel();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack()) {
        back();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [back, canGoBack]);

  if (!isRouteName(route.name) || !Object.prototype.hasOwnProperty.call(routeScreens, route.name)) {
    return (
      <AppScreen bottom={<Button title="Về trang chủ" onPress={() => tab('home')} />}>
        <Label size={21} weight="bold">
          Không tìm thấy màn hình
        </Label>
        <Label color="#757575" style={{ marginTop: 8 }}>
          Đường dẫn không hợp lệ. Vui lòng quay lại trang chủ.
        </Label>
      </AppScreen>
    );
  }
  const RouteScreen = routeScreens[route.name];
  return <RouteScreen />;
}
