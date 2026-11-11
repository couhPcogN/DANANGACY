import React from 'react';
import { useApp } from '../providers/AppProvider';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ItineraryScreen } from '../features/itinerary/screens/ItineraryScreen';
import { GameScreen } from '../features/game/screens/GameScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

export function AppNavigator() {
  const { route } = useApp();
  if (['welcome', 'login', 'register', 'forgot', 'verify', 'reset'].includes(route.name)) return <AuthScreen />;
  if (route.name === 'home') return <HomeScreen />;
  if (['explore', 'map', 'place'].includes(route.name)) return <ExploreScreen />;
  if (['itinerary', 'tripInfo', 'tripPreferences', 'tripPlaces', 'tripReview', 'tripSaved', 'tripDetail', 'tripEdit', 'tripEditPlaces', 'weather', 'replacement', 'replacementConfirm'].includes(route.name)) return <ItineraryScreen />;
  if (['game', 'gameIntro', 'quiz', 'quizResult', 'quizAnswers', 'rewards', 'rewardDetail', 'redeemed', 'myRewards'].includes(route.name)) return <GameScreen />;
  return <ProfileScreen />;
}

