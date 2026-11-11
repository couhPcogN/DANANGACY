import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

type ScreenProps = {
  children: ReactNode;
  bottom?: ReactNode;
  scroll?: boolean;
  tabs?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  bottom,
  scroll = true,
  tabs = false,
  contentStyle,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      {content}
      {bottom ? (
        <View style={[styles.bottom, tabs && { paddingHorizontal: 0, paddingBottom: 0 }]}>
          {bottom}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, flexGrow: 1 },
  bottom: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.white },
});
