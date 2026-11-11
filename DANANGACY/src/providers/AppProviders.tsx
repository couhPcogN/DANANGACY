import React from 'react';
import { AppProvider } from './AppProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@expo-google-fonts/be-vietnam-pro/useFonts';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({ BeVietnamPro_400Regular, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold });
  if (!fontsLoaded) return null;
  return <SafeAreaProvider><AppProvider>{children}</AppProvider></SafeAreaProvider>;
}
