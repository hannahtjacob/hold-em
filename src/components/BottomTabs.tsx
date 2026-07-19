import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

export type TabName = 'home' | 'profile';

type BottomTabsProps = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
};

const tabs: {
  name: TabName;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  accessibilityLabel: string;
}[] = [
  { name: 'home', icon: 'clock', accessibilityLabel: 'Clock' },
  { name: 'profile', icon: 'cards-spade', accessibilityLabel: 'Spade' },
];

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityState={{ selected: isActive }}
            key={tab.name}
            onPress={() => onTabChange(tab.name)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              color={isActive ? '#f7f3e8' : '#829c91'}
              name={tab.icon}
              size={25}
            />
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d2b21',
    borderTopColor: '#214f3d',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingTop: 10,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: {
    opacity: 0.65,
  },
  indicator: {
    backgroundColor: '#d62828',
    borderRadius: 2,
    bottom: -4,
    height: 3,
    position: 'absolute',
    width: 28,
  },
});
