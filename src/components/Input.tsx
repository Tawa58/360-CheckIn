import React from 'react';
import {Text, TextInput, View, type TextInputProps} from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export function Input({label, error, leftIcon, rightSlot, ...rest}: Props) {
  return (
    <View className="w-full">
      <Text className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-2xl border px-3 ${
          error
            ? 'border-red-400 bg-red-50 dark:bg-red-950'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}>
        {leftIcon ? <View className="pr-2">{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor="#94A3B8"
          className="h-12 min-w-0 flex-1 py-3 text-base text-slate-900 dark:text-slate-100"
          {...rest}
        />
        {rightSlot}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}
