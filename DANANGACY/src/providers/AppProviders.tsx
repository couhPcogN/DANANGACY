import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { useFonts } from '@expo-google-fonts/be-vietnam-pro/useFonts';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './AppProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>{children}</AppProvider>
    </SafeAreaProvider>
  );
}
