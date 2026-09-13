import React from 'react';
import {View} from 'react-native';

export function Card({children}: {children: React.ReactNode}) {
  return (
    <View className="rounded-3xl border border-ink-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      {children}
    </View>
  );
}
