import { Alert, Platform } from 'react-native';

export function notify(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
  } else Alert.alert('DANANGACY', message);
}
