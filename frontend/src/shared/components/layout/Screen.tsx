import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import { getResponsiveLayout } from '../../layout/responsive';

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { horizontalPadding, maxWidth } = getResponsiveLayout(width);
  const content = scroll ? (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: horizontalPadding },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1, paddingHorizontal: horizontalPadding }, contentStyle]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          width: '100%',
          maxWidth,
        },
      ]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <StatusBar style="dark" />
        {content}
        {bottom ? (
          <View
            style={[
              styles.bottom,
              tabs && { paddingHorizontal: 0, paddingBottom: 0 },
              !tabs && {
                paddingHorizontal: horizontalPadding,
                paddingBottom: Math.max(8, insets.bottom),
              },
            ]}
          >
            {bottom}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  keyboardAvoiding: { flex: 1 },
  content: { paddingTop: 4, paddingBottom: 24, flexGrow: 1 },
  bottom: { paddingTop: 8, paddingBottom: 8, backgroundColor: colors.white },
});
