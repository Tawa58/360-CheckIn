import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {CalendarCheck, ClipboardList, MessageSquarePlus, UserRound} from 'lucide-react-native';
import {useAuth} from '../context/AuthContext';
import {LoginScreen} from '../screens/LoginScreen';
import {CheckInScreen} from '../screens/CheckInScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {ReportScreen} from '../screens/ReportScreen';
import {ProfileScreen} from '../screens/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  CheckIn: undefined;
  History: undefined;
  Report: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F4C5C',
        tabBarInactiveTintColor: '#8A9AA8',
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: '#E6EEF0',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      }}>
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarLabel: 'Check in',
          tabBarIcon: ({color}) => <CalendarCheck size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({color}) => <ClipboardList size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({color}) => <MessageSquarePlus size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color}) => <UserRound size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const {initializing, employee} = useAuth();

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-100">
        <ActivityIndicator size="large" color="#0F4C5C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {employee ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
