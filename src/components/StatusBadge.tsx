import React from 'react';
import {Text, View} from 'react-native';
import type {LocationStatus} from '../../shared/types';

const STYLES: Record<
  LocationStatus | 'Blocked' | 'Expired' | 'Active',
  {bg: string; text: string}
> = {
  Verified: {bg: 'bg-emerald-50', text: 'text-emerald-700'},
  Rejected: {bg: 'bg-red-50', text: 'text-red-700'},
  Blocked: {bg: 'bg-amber-50', text: 'text-amber-800'},
  Expired: {bg: 'bg-red-50', text: 'text-red-700'},
  Active: {bg: 'bg-emerald-50', text: 'text-emerald-700'},
};

export function StatusBadge({
  status,
}: {
  status: LocationStatus | 'Blocked' | 'Expired' | 'Active';
}) {
  const style = STYLES[status];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.bg}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{status}</Text>
    </View>
  );
}
