import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../../theme';

import { Label } from './Label';
import type { IconName } from './types';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: IconName;
  multiline?: boolean;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  icon,
  multiline = false,
}: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Label size={13} weight="medium" style={{ marginBottom: 6 }}>
          {label}
        </Label>
      ) : null}
      <View style={styles.field}>
        <TextInput
          accessibilityLabel={label || placeholder || 'Trường nhập'}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && { height: 76, textAlignVertical: 'top' }]}
        />
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 49,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    padding: 0,
  },
});
