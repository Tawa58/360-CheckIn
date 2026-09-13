import React from 'react';
import {Alert, Modal, Pressable, Text, View} from 'react-native';
import {useNavigation, useNavigationState} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  ClipboardList,
  LogOut,
  MessageSquarePlus,
  Settings,
  X,
} from 'lucide-react-native';
import {useAuth} from '../context/AuthContext';
import {useDrawer} from '../context/DrawerContext';
import {useTheme} from '../context/ThemeContext';
import type {MainTabParamList} from '../navigation/types';
import {Avatar} from './Avatar';
import {LogoMark} from './Logo';

const LINKS = [
  {name: 'Attendance', label: 'Attendance report', Icon: ClipboardList},
  {name: 'Report', label: 'Send a report', Icon: MessageSquarePlus},
  {name: 'Settings', label: 'Settings', Icon: Settings},
] as const;

export function AppDrawer() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const current = useNavigationState(state => state.routes[state.index]?.name);
  const {employee, logout} = useAuth();
  const {open, hide} = useDrawer();
  const {theme} = useTheme();
  const icon = theme === 'dark' ? '#E2E8F0' : '#0F4C5C';
  const activeIcon = theme === 'dark' ? '#99F6E4' : '#0F4C5C';

  function go(name: (typeof LINKS)[number]['name']) {
    hide();
    navigation.navigate(name);
  }

  function signOut() {
    hide();
    Alert.alert('Log out', 'You will need your access code to sign in again.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout().catch(() => undefined);
        },
      },
    ]);
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={hide}>
      <View className="flex-1 flex-row justify-end bg-slate-950/50">
        <Pressable className="flex-1" onPress={hide} />
        <View className="h-full w-[72%] max-w-[17rem] bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3 dark:border-slate-800">
            <LogoMark />
            <Pressable
              accessibilityLabel="Close menu"
              onPress={hide}
              className="h-9 w-9 items-center justify-center rounded-full">
              <X size={20} color={icon} />
            </Pressable>
          </View>

          {employee ? (
            <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
              <View className="min-w-0 flex-1">
                <Text className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {employee.fullName}
                </Text>
                <Text className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {employee.department}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="flex-1 p-3">
            {LINKS.map(link => {
              const active = current === link.name;
              return (
                <Pressable
                  key={link.name}
                  onPress={() => go(link.name)}
                  className={`mb-1 flex-row items-center gap-3 rounded-2xl px-3.5 py-3 ${
                    active
                      ? 'bg-brand-50 dark:bg-brand-500/15'
                      : 'bg-transparent'
                  }`}>
                  <link.Icon size={18} color={active ? activeIcon : icon} />
                  <Text
                    className={`text-sm font-medium ${
                      active
                        ? 'text-brand-800 dark:text-teal-200'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                    {link.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="border-t border-slate-100 p-4 dark:border-slate-800">
            <Pressable
              onPress={signOut}
              className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <LogOut size={16} color={icon} />
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Log out
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
