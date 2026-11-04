import React from 'react';
import { AppProvider, useApp } from './src/state';
import { AuthScreen } from './src/screens/Auth';
import { ExploreScreen } from './src/screens/Explore';
import { HomeScreen } from './src/screens/Home';
import { ItineraryScreen } from './src/screens/Itinerary';
import { GameScreen } from './src/screens/Game';
import { ProfileScreen } from './src/screens/Profile';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@expo-google-fonts/be-vietnam-pro/useFonts';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';

function Router() {
  const { route } = useApp();
  if (['welcome', 'login', 'register', 'forgot', 'verify', 'reset'].includes(route.name)) return <AuthScreen />;
  if (route.name === 'home') return <HomeScreen />;
  if (['explore', 'map', 'place'].includes(route.name)) return <ExploreScreen />;
  if (['itinerary', 'tripInfo', 'tripPreferences', 'tripPlaces', 'tripReview', 'tripSaved', 'tripDetail', 'tripEdit', 'tripEditPlaces', 'weather', 'replacement', 'replacementConfirm'].includes(route.name)) return <ItineraryScreen />;
  if (['game', 'gameIntro', 'quiz', 'quizResult', 'quizAnswers', 'rewards', 'rewardDetail', 'redeemed', 'myRewards'].includes(route.name)) return <GameScreen />;
  return <ProfileScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({ BeVietnamPro_400Regular, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold });
  if (!fontsLoaded) return null;
  return <SafeAreaProvider><AppProvider><Router /></AppProvider></SafeAreaProvider>;
}
