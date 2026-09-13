import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-800 active:bg-brand-900',
  secondary: 'bg-brand-50 active:bg-brand-100 dark:bg-slate-800',
  ghost: 'bg-transparent',
  danger: 'bg-red-600 active:bg-red-700',
};

const textClass: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-800 dark:text-slate-100',
  ghost: 'text-brand-800 dark:text-slate-100',
  danger: 'text-white',
};

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  ...rest
}: Props) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${variantClass[variant]} ${
        isDisabled ? 'opacity-50' : ''
      }`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#0F4C5C'} />
      ) : (
        <Text className={`text-base font-semibold ${textClass[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
