import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, space } from './theme';
import type { Place } from './data';
import { TabName, useApp } from './state';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Label({ children, size = 15, weight = 'regular', color = colors.ink, style }: { children: React.ReactNode; size?: number; weight?: 'regular' | 'medium' | 'bold'; color?: string; style?: StyleProp<any> }) {
  const fontFamily = weight === 'bold' ? 'BeVietnamPro_700Bold' : weight === 'medium' ? 'BeVietnamPro_600SemiBold' : 'BeVietnamPro_400Regular';
  return <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.42), color, fontFamily }, style]}>{children}</Text>;
}

export function Screen({ children, bottom, scroll = true, tabs = false, contentStyle }: { children: React.ReactNode; bottom?: React.ReactNode; scroll?: boolean; tabs?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const content = scroll ? <ScrollView style={{ flex: 1, minHeight: 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView> : <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>;
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><StatusBar style="dark" />{content}{bottom ? <View style={[styles.bottom, tabs && { paddingHorizontal: 0, paddingBottom: 0 }]}>{bottom}</View> : null}</SafeAreaView>;
}

export function Header({ title, subtitle, onBack, action, actionIcon }: { title: string; subtitle?: string; onBack?: () => void; action?: () => void; actionIcon?: IconName }) {
  return <View style={styles.header}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={{ left: 8, right: 8 }} onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={24} color={colors.ink} /></Pressable> : null}
      <View style={{ flex: 1 }}><Label size={21} weight="bold">{title}</Label>{subtitle ? <Label size={12} color={colors.muted}>{subtitle}</Label> : null}</View>
    </View>
    {action && actionIcon ? <Pressable accessibilityRole="button" hitSlop={4} onPress={action} style={styles.iconButton}><Ionicons name={actionIcon} size={21} color={colors.primaryDark} /></Pressable> : null}
  </View>;
}

export function Button({ title, onPress, kind = 'primary', icon, disabled = false, style }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline'; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const background = disabled ? colors.disabled : kind === 'primary' ? colors.primary : kind === 'secondary' ? colors.warm : colors.white;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} hitSlop={4} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: background, borderWidth: kind === 'outline' ? 1 : 0, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }, style]}>
    {icon ? <Ionicons name={icon} size={19} color={kind === 'secondary' ? colors.primaryDark : colors.ink} style={{ marginRight: 8 }} /> : null}
    <Label weight="bold" size={15} color={disabled ? colors.muted : kind === 'secondary' ? colors.primaryDark : colors.ink}>{title}</Label>
  </Pressable>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress}>{content}</Pressable> : content;
}

export function Pill({ title, selected = false, tone = 'orange', onPress }: { title: string; selected?: boolean; tone?: 'orange' | 'green' | 'blue' | 'gray'; onPress?: () => void }) {
  const isTag = tone !== 'orange';
  const background = isTag ? tone === 'green' ? colors.successBg : tone === 'blue' ? colors.infoBg : colors.subtle : selected ? colors.warm : colors.white;
  const foreground = isTag ? tone === 'green' ? colors.success : tone === 'blue' ? colors.info : colors.muted : selected ? colors.primaryDark : colors.ink;
  const body = <View style={[styles.pill, { backgroundColor: background, borderColor: isTag ? background : selected ? colors.primary : colors.border, paddingVertical: isTag ? 3 : 7, paddingHorizontal: isTag ? 9 : 11 }]}><Label size={isTag ? 12 : 13} weight={selected || isTag ? 'medium' : 'regular'} color={foreground}>{title}</Label></View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ selected }} hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }} onPress={onPress}>{body}</Pressable> : body;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', icon, multiline = false }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'; icon?: IconName; multiline?: boolean }) {
  return <View style={{ marginBottom: 14 }}>{label ? <Label size={13} weight="medium" style={{ marginBottom: 6 }}>{label}</Label> : null}<View style={styles.field}><TextInput accessibilityLabel={label || placeholder || 'Trường nhập'} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} style={[styles.input, multiline && { height: 76, textAlignVertical: 'top' }]} />{icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}</View></View>;
}

export function InfoBanner({ children, tone = 'orange', icon = 'information-circle-outline' }: { children: React.ReactNode; tone?: 'orange' | 'blue' | 'green'; icon?: IconName }) {
  const bg = tone === 'blue' ? colors.infoBg : tone === 'green' ? colors.successBg : colors.warm;
  const fg = tone === 'blue' ? colors.info : tone === 'green' ? colors.success : colors.primaryDark;
  return <View style={[styles.banner, { backgroundColor: bg, borderColor: tone === 'orange' ? colors.warmBorder : bg }]}><Ionicons name={icon} size={19} color={fg} style={{ marginRight: 10, marginTop: 1 }} /><Label size={13} color={fg} style={{ flex: 1 }}>{children}</Label></View>;
}

export function PlacePhoto({ source, name, height = 96, style }: { source?: ImageSourcePropType; name: string; height?: number; style?: StyleProp<ImageStyle> }) {
  return source ? <Image source={source} accessibilityLabel={name} resizeMode="cover" style={[{ height, borderRadius: radius.md, width: '100%' }, style]} /> : <View style={[styles.placeholder, { height }, style]}><Ionicons name="business-outline" size={30} color={colors.muted} /><Label size={13} weight="medium">Bảo tàng Đà Nẵng · Cơ sở mới</Label><Label size={12} color={colors.muted}>Ảnh đang cập nhật</Label></View>;
}

export function PlaceRow({ place, onPress, selected = false, trailing = 'chevron-forward', small = false }: { place: Place; onPress: () => void; selected?: boolean; trailing?: IconName; small?: boolean }) {
  return <Card onPress={onPress} style={[styles.placeRow, selected && { borderColor: colors.primary }]}><View style={{ width: small ? 68 : 100, height: small ? 68 : 100, marginRight: 12 }}><PlacePhoto source={place.image} name={place.name} height={small ? 68 : 100} /></View><View style={{ flex: 1, justifyContent: 'center' }}><Label size={14} weight="bold">{place.name}</Label>{!small ? <Label size={12} color={colors.muted} style={{ marginTop: 4 }}>{place.area}</Label> : null}<View style={{ alignSelf: 'flex-start', marginTop: 6 }}><Pill title={place.category} tone={place.category === 'Trong nhà' ? 'green' : 'blue'} /></View></View><Ionicons name={trailing} size={19} color={colors.primaryDark} /></Card>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitle}><Label size={16} weight="bold">{title}</Label>{action && onAction ? <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}><Label size={13} color={colors.primaryDark}>{action}</Label></Pressable> : null}</View>;
}

export function Progress({ step, total, compact = false }: { step: number; total: number; compact?: boolean }) {
  return <View style={{ flexDirection: 'row', gap: 4, marginVertical: compact ? 3 : 8 }}>{Array.from({ length: total }, (_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 4, backgroundColor: i < step ? colors.primary : colors.disabled }} />)}</View>;
}

const tabItems: { name: TabName; label: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'home', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home-outline' },
  { name: 'explore', label: 'Khám phá', icon: 'compass-outline', activeIcon: 'compass-outline' },
  { name: 'itinerary', label: 'Lịch trình', icon: 'calendar-outline', activeIcon: 'calendar-outline' },
  { name: 'game', label: 'Mini game', icon: 'game-controller-outline', activeIcon: 'game-controller-outline' },
  { name: 'profile', label: 'Hồ sơ', icon: 'person-outline', activeIcon: 'person-outline' },
];

export function Tabs({ active }: { active: TabName }) {
  const { tab } = useApp();
  return <View style={styles.tabs}>{tabItems.map((item) => <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: item.name === active }} onPress={() => tab(item.name)} style={styles.tabItem}>
    <View style={[styles.tabIcon, item.name === active && { backgroundColor: colors.warm }]}><Ionicons name={item.name === active ? item.activeIcon : item.icon} size={22} color={item.name === active ? colors.primaryDark : colors.muted} /></View>
    <Label size={11} weight={item.name === active ? 'bold' : 'regular'} color={item.name === active ? colors.primaryDark : colors.muted}>{item.label}</Label>
  </Pressable>)}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, width: '100%', maxWidth: 390, alignSelf: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, flexGrow: 1 },
  bottom: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.white },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { width: 28, height: 44, justifyContent: 'center', marginRight: 4 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warm },
  button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, marginBottom: 12 },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7, alignSelf: 'flex-start' },
  field: { height: 49, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.subtle, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, color: colors.ink, fontSize: 14, fontFamily: 'BeVietnamPro_400Regular', padding: 0 },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: 12, flexDirection: 'row', marginVertical: 8 },
  placeholder: { backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 3 },
  placeRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  tabs: { borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', paddingHorizontal: 4, paddingTop: 6, paddingBottom: 4, backgroundColor: colors.white },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58, gap: 2 },
  tabIcon: { width: 38, height: 34, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
});
