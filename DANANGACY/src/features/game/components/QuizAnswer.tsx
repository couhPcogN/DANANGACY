import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Card, Label } from '../../../components';
import { colors } from '../../../theme';

type QuizAnswerProps = {
  answer: string;
  index: number;
  selected: boolean;
  confirmed: boolean;
  correct: boolean;
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
      borderColor = correct ? colors.success : colors.error;
      backgroundColor = correct ? colors.successBg : colors.errorBg;
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
