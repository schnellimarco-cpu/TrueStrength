import { Image, ImageSource } from 'expo-image';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

const ACCENT = '#FF9500';
const INACTIVE = '#B0B4BA';
const PILL_BG = '#383A3F';

type TabButtonProps = TabTriggerSlotProps & { icon: ImageSource };

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/home.png')}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/explore.png')}>Workout</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/explore.png')}>Progress</TabButton>
          </TabTrigger>
          <TabTrigger name="plan" href="/plan" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/explore.png')}>Plan</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/explore.png')}>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Image source={icon} style={styles.icon} tintColor={isFocused ? ACCENT : INACTIVE} />
      <Text style={[styles.label, { color: isFocused ? ACCENT : INACTIVE }]}>{children}</Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.pill}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Spacing.four,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: PILL_BG,
    borderRadius: 32,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: 20,
    gap: Spacing.half,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
