import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {clampMonth, formatMonthLabel, shiftMonth} from '../../shared/personalAttendance';

export function MonthPicker({
  month,
  minMonth,
  maxMonth,
  onChange,
}: {
  month: string;
  minMonth: string;
  maxMonth: string;
  onChange: (month: string) => void;
}) {
  function change(delta: number) {
    onChange(clampMonth(shiftMonth(month, delta), minMonth, maxMonth));
  }

  return (
    <View className="mt-5">
      <Text className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        Month
      </Text>
      <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <Pressable
          onPress={() => change(-1)}
          disabled={month <= minMonth}
          className="h-10 w-10 items-center justify-center">
          <Text
            className={`text-xl font-bold ${
              month <= minMonth ? 'text-slate-300' : 'text-brand-800 dark:text-teal-300'
            }`}>
            ‹
          </Text>
        </Pressable>
        <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-white">
          {formatMonthLabel(month)}
        </Text>
        <Pressable
          onPress={() => change(1)}
          disabled={month >= maxMonth}
          className="h-10 w-10 items-center justify-center">
          <Text
            className={`text-xl font-bold ${
              month >= maxMonth ? 'text-slate-300' : 'text-brand-800 dark:text-teal-300'
            }`}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
