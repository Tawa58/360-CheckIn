import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {MapPin, ShieldAlert, ShieldCheck, RefreshCw} from 'lucide-react-native';
import type {LocationResult} from '../services/locationService';

type Props = {
  gps: LocationResult | null;
  loading: boolean;
  onRetry: () => void;
};

export function GpsBanner({gps, loading, onRetry}: Props) {
  const verified = gps?.ok === true;
  const message = loading
    ? 'Requesting GPS location…'
    : verified
      ? `Location verified · ${gps.location.latitude.toFixed(5)}, ${gps.location.longitude.toFixed(5)}`
      : gps
        ? gps.message
        : 'GPS has not been verified yet.';

  return (
    <View
      className={`rounded-3xl border p-5 ${
        verified
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
      <View className="flex-row items-start">
        <View
          className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl ${
            verified ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
          {verified ? (
            <ShieldCheck size={22} color="#047857" />
          ) : (
            <ShieldAlert size={22} color="#B45309" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink-900">
            {verified ? 'GPS verified' : 'GPS required'}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-ink-500">{message}</Text>
        </View>
      </View>
      <Pressable
        onPress={onRetry}
        disabled={loading}
        className="mt-4 h-11 flex-row items-center justify-center rounded-2xl bg-white">
        {loading ? (
          <MapPin size={16} color="#0F4C5C" />
        ) : (
          <RefreshCw size={16} color="#0F4C5C" />
        )}
        <Text className="ml-2 text-sm font-semibold text-brand-800">
          {loading ? 'Locating…' : 'Refresh location'}
        </Text>
      </Pressable>
    </View>
  );
}
