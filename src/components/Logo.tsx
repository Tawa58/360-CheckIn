import React from 'react';
import {Image, type ImageStyle, type StyleProp} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const LOCKUP = {
  color: require('../../admin/public/brand/logo.png'),
  light: require('../../admin/public/brand/logo-light.png'),
} as const;

type Props = {
  variant?: 'color' | 'light' | 'auto';
  style?: StyleProp<ImageStyle>;
};

export function Logo({variant = 'auto', style}: Props) {
  const {theme} = useTheme();
  const source =
    variant === 'auto'
      ? LOCKUP[theme === 'dark' ? 'light' : 'color']
      : LOCKUP[variant];

  return (
    <Image
      accessibilityLabel="CheckIn360"
      resizeMode="contain"
      source={source}
      style={[{height: 40, width: 176}, style]}
    />
  );
}
