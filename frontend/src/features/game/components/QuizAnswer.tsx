import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Card, Label } from '../../../shared/components';
import { colors } from '../../../theme';

type QuizAnswerProps = {
  answer: string;
  index: number;
  selected: boolean;
  confirmed: boolean;
  correct?: boolean | null;
  onSelect: () => void;
};

export function QuizAnswer({
  answer,
  index,
  selected,
  confirmed,
  correct,
  onSelect,
}: QuizAnswerProps) {
  let borderColor: string = colors.border;
  let backgroundColor: string = colors.white;

  if (selected) {
    borderColor = colors.primary;
    backgroundColor = colors.warm;
    if (confirmed) {
      if (correct === true) {
        borderColor = colors.success;
        backgroundColor = colors.successBg;
      } else if (correct === false) {
        borderColor = colors.error;
        backgroundColor = colors.errorBg;
      } else {
        // Ungraded / Server-evaluated: preserve active highlight without false error
        borderColor = colors.primaryDark;
        backgroundColor = colors.warm;
      }
    }
  }

  return (
    <Card onPress={onSelect} style={{ marginBottom: 8, borderColor, backgroundColor }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Label color={colors.muted} weight="bold">
          {'ABCD'[index]}
        </Label>
        <Label style={{ flex: 1 }}>{answer}</Label>
        <Ionicons
          name={selected ? 'radio-button-on-outline' : 'radio-button-off-outline'}
          size={20}
          color={selected ? colors.primaryDark : colors.muted}
        />
      </View>
    </Card>
  );
}
