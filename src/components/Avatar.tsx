import React from 'react';
import {Image, Text, View} from 'react-native';

const SIZE = {
  sm: {box: 'h-10 w-10', text: 'text-xs'},
  md: {box: 'h-14 w-14', text: 'text-sm'},
  lg: {box: 'h-24 w-24', text: 'text-2xl'},
} as const;

export function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string;
  size?: keyof typeof SIZE;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
  const style = SIZE[size];

  if (photoUrl) {
    return (
      <Image
        source={{uri: photoUrl}}
        className={`${style.box} rounded-full bg-brand-100`}
      />
    );
  }

  return (
    <View
      className={`${style.box} items-center justify-center rounded-full bg-brand-100`}>
      <Text className={`${style.text} font-semibold text-brand-800`}>
        {initials || '?'}
      </Text>
    </View>
  );
}
