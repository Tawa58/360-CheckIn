import React from 'react';
import {Image, type ImageStyle, type StyleProp} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const LOCKUP = {
  color: require('../../admin/public/brand/logo.png'),
  light: require('../../admin/public/brand/logo-light.png'),
} as const;

const MARK = require('../../admin/public/brand/mark.png');

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
      style={[{height: 36, width: 160}, style]}
    />
  );
}

export function LogoMark({style}: {style?: StyleProp<ImageStyle>}) {
  return (
    <Image
      accessibilityLabel="CheckIn360"
      resizeMode="contain"
      source={MARK}
      style={[{height: 32, width: 29}, style]}
    />
  );
}
