import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import {DrawerProvider} from '../context/DrawerContext';
import {AppDrawer} from '../components/AppDrawer';
import {AppHeader} from '../components/AppHeader';
import {EmployeeTabBar} from '../components/EmployeeTabBar';
import {Logo} from '../components/Logo';
import {LoginScreen} from '../screens/LoginScreen';
import {ForgotDetailsScreen} from '../screens/ForgotDetailsScreen';
import {CheckInScreen} from '../screens/CheckInScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {AttendanceScreen} from '../screens/AttendanceScreen';
import {ReportScreen} from '../screens/ReportScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import type {MainTabParamList, RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <DrawerProvider>
      <Tab.Navigator
        tabBar={props => <EmployeeTabBar {...props} />}
        screenOptions={{headerShown: false}}
        layout={({children}) => (
          <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <SafeAreaView
              edges={['top']}
              className="bg-white dark:bg-slate-900">
              <AppHeader />
            </SafeAreaView>
            <View className="flex-1">{children}</View>
            <AppDrawer />
          </View>
        )}>
        <Tab.Screen name="CheckIn" component={CheckInScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Attendance" component={AttendanceScreen} />
        <Tab.Screen name="Report" component={ReportScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </DrawerProvider>
  );
}

export function RootNavigator() {
  const {initializing, employee} = useAuth();

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-brand-900 px-6">
        <Logo variant="light" />
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color="#FFFFFF" />
          <Text className="text-sm text-white/70">Loading CheckIn360…</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {employee ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Forgot" component={ForgotDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
