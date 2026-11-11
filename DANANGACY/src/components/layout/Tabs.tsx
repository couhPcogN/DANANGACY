import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TabName } from '../../navigation/types';
import { useApp } from '../../providers/AppProvider';
import { colors } from '../../theme';

import { Label } from '../ui/Label';
import type { IconName } from '../ui/types';

const tabItems: { name: TabName; label: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'home', label: 'Trang chủ', icon: 'home-outline', activeIcon: 'home-outline' },
  { name: 'explore', label: 'Khám phá', icon: 'compass-outline', activeIcon: 'compass-outline' },
  {
    name: 'itinerary',
    label: 'Lịch trình',
    icon: 'calendar-outline',
    activeIcon: 'calendar-outline',
  },
  {
    name: 'game',
    label: 'Mini game',
    icon: 'game-controller-outline',
    activeIcon: 'game-controller-outline',
  },
  { name: 'profile', label: 'Hồ sơ', icon: 'person-outline', activeIcon: 'person-outline' },
];

type TabsProps = { active: TabName };

export function Tabs({ active }: TabsProps) {
  const { tab } = useApp();
  return (
    <View style={styles.tabs}>
      {tabItems.map((item) => (
        <Pressable
          key={item.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: item.name === active }}
          onPress={() => tab(item.name)}
          style={styles.tabItem}
        >
          <View style={[styles.tabIcon, item.name === active && { backgroundColor: colors.warm }]}>
            <Ionicons
              name={item.name === active ? item.activeIcon : item.icon}
              size={22}
              color={item.name === active ? colors.primaryDark : colors.muted}
            />
          </View>
          <Label
            size={11}
            weight={item.name === active ? 'bold' : 'regular'}
            color={item.name === active ? colors.primaryDark : colors.muted}
          >
            {item.label}
          </Label>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: colors.white,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58, gap: 2 },
  tabIcon: {
    width: 38,
    height: 34,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
