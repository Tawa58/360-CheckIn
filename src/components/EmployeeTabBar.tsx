import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {CalendarCheck, Clock3, UserRound} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';
import type {MainTabParamList} from '../navigation/types';

const TABS: {
  name: keyof MainTabParamList;
  label: string;
  Icon: typeof CalendarCheck;
}[] = [
  {name: 'CheckIn', label: 'Check in', Icon: CalendarCheck},
  {name: 'History', label: 'History', Icon: Clock3},
  {name: 'Profile', label: 'Profile', Icon: UserRound},
];

export function EmployeeTabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const isDark = theme === 'dark';
  const current = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
      style={{paddingBottom: Math.max(insets.bottom, 8)}}>
      <View className="flex-row">
        {TABS.map(tab => {
          const active = current === tab.name;
          const color = active
            ? isDark
              ? '#5EEAD4'
              : '#0F4C5C'
            : isDark
              ? '#64748B'
              : '#94A3B8';
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={{selected: active}}
              accessibilityLabel={tab.label}
              onPress={() => navigation.navigate(tab.name)}
              className="min-h-[58px] flex-1 items-center justify-center px-2 pt-2">
              <View
                className={`h-8 w-14 items-center justify-center rounded-full ${
                  active ? 'bg-brand-50 dark:bg-brand-500/15' : 'bg-transparent'
                }`}>
                <tab.Icon size={18} color={color} />
              </View>
              <Text
                className={`mt-1 text-[11px] font-medium ${
                  active
                    ? 'text-brand-800 dark:text-teal-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
