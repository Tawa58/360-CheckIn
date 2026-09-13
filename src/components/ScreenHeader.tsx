import React from 'react';
import {View} from 'react-native';
import {Logo} from './Logo';
import {ThemeToggle} from './ThemeToggle';

export function ScreenHeader() {
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <Logo />
      <ThemeToggle />
    </View>
  );
}
