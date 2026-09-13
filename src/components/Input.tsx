import React from 'react';
import {Text, TextInput, View, type TextInputProps} from 'react-native';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({label, error, ...rest}: Props) {
  return (
    <View className="w-full">
      <Text className="mb-2 text-sm font-semibold text-ink-800 dark:text-slate-200">
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#8A9AA8"
        className={`h-14 rounded-2xl border px-4 text-base text-ink-900 dark:text-white ${
          error
            ? 'border-red-400 bg-red-50 dark:bg-red-950'
            : 'border-ink-200 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}
        {...rest}
      />
      {error ? (
        <Text className="mt-1 text-xs text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}
