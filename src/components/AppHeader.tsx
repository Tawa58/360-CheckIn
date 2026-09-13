import React from 'react';
import {Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {Menu} from 'lucide-react-native';
import {useAuth} from '../context/AuthContext';
import {useDrawer} from '../context/DrawerContext';
import {useTheme} from '../context/ThemeContext';
import type {MainTabParamList} from '../navigation/types';
import {Avatar} from './Avatar';
import {Logo} from './Logo';
import {ThemeToggle} from './ThemeToggle';

export function AppHeader() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {employee} = useAuth();
  const {show} = useDrawer();
  const {theme} = useTheme();
  const icon = theme === 'dark' ? '#CBD5E1' : '#0F4C5C';

  return (
    <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {employee ? (
          <Pressable
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate('Profile')}>
            <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
          </Pressable>
        ) : null}
        <Logo />
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityLabel="Open menu"
          onPress={show}
          className="h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <Menu size={18} color={icon} />
        </Pressable>
        <ThemeToggle />
      </View>
    </View>
  );
}
