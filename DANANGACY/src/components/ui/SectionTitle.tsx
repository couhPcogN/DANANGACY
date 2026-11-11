import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

import { Label } from './Label';

type SectionTitleProps = { title: string; action?: string; onAction?: () => void };

export function SectionTitle({ title, action, onAction }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitle}>
      <Label size={16} weight="bold">
        {title}
      </Label>
      {action && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <Label size={13} color={colors.primaryDark}>
            {action}
          </Label>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
});
