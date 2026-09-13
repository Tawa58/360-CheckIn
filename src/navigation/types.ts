import type {NavigatorScreenParams} from '@react-navigation/native';

export type MainTabParamList = {
  CheckIn: undefined;
  History: undefined;
  Profile: undefined;
  Attendance: undefined;
  Report: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
