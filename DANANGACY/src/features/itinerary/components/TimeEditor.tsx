import { View } from 'react-native';
import { Button, Card, Field, InfoBanner, Label } from '../../../components';
import { colors } from '../../../theme';

type TimeEditorProps = {
  start: string;
  end: string;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  apply: () => void;
  cancel: () => void;
  error: string | null;
};

export function TimeEditor({
  start,
  end,
  setStart,
  setEnd,
  apply,
  cancel,
  error,
}: TimeEditorProps) {
  return (
    <Card style={{ borderColor: colors.primary }}>
      <Label weight="bold" style={{ marginBottom: 12 }}>
        Chỉnh khung giờ
      </Label>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Bắt đầu (HH:mm)" value={start} onChangeText={setStart} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Kết thúc (HH:mm)" value={end} onChangeText={setEnd} />
        </View>
      </View>
      {error ? (
        <InfoBanner>{error}</InfoBanner>
      ) : (
        <InfoBanner tone="green">Khung giờ hợp lệ, có thể áp dụng.</InfoBanner>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Hủy" kind="outline" onPress={cancel} style={{ flex: 1 }} />
        <Button title="Áp dụng" disabled={!!error} onPress={apply} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
