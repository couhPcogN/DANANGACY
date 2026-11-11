import { Ionicons } from '@expo/vector-icons';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from './Label';

type PlacePhotoProps = {
  source?: ImageSourcePropType;
  name: string;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function PlacePhoto({ source, name, height = 96, style }: PlacePhotoProps) {
  return source ? (
    <Image
      source={source}
      accessibilityLabel={name}
      resizeMode="cover"
      style={[{ height, borderRadius: radius.md, width: '100%' }, style]}
    />
  ) : (
    <View style={[styles.placeholder, { height }, style]}>
      <Ionicons name="business-outline" size={30} color={colors.muted} />
      <Label size={13} weight="medium">
        Bảo tàng Đà Nẵng · Cơ sở mới
      </Label>
      <Label size={12} color={colors.muted}>
        Ảnh đang cập nhật
      </Label>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
});
