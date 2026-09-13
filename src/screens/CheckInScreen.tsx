import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  ChevronRight,
  Clock,
  MapPin,
  MapPinOff,
  ShieldAlert,
  ShieldCheck,
  Signal,
} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {getTodayAttendance, submitCheckIn} from '../services/attendanceService';
import {useGeofenceMonitor} from '../hooks/useGeofenceMonitor';
import {GeofencePanel} from '../components/GeofencePanel';
import type {MainTabParamList} from '../navigation/types';
import type {AttendanceRecord} from '../../shared/types';
import {formatDisplayDate, localISODate} from '../../shared/dates';

function formatCoords(latitude: number, longitude: number): string {
  const eastWest = longitude >= 0 ? 'E' : 'W';
  return `${latitude.toFixed(5)}, ${Math.abs(longitude).toFixed(5)}${eastWest}`;
}

export function CheckInScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {employee} = useAuth();
  const {theme} = useTheme();
  const geofence = useGeofenceMonitor(employee);
  const {gps, gpsLoading, refreshGps} = geofence;
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = employee?.fullName.split(' ')[0] ?? 'there';
  const gpsReady = gps?.ok === true;
  const alreadyCheckedIn = Boolean(todayRecord);
  const outside = geofence.zone === 'outside';
  const muted = theme === 'dark' ? '#94A3B8' : '#64748B';

  const loadToday = useCallback(async () => {
    if (!employee) {
      return;
    }
    const record = await getTodayAttendance(employee.authUid);
    setTodayRecord(record);
  }, [employee]);

  useEffect(() => {
    refreshGps();
    loadToday().catch(() => {
      setError('Unable to load today’s attendance.');
    });
  }, [loadToday, refreshGps]);

  async function onCheckIn() {
    if (!employee) {
      return;
    }
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const latestGps = await refreshGps();
      if (!latestGps.ok) {
        throw new Error(latestGps.message);
      }
      const record = await submitCheckIn(employee, latestGps.location);
      setTodayRecord(record);
      setMessage('Attendance saved. Location verified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="px-4 pb-10 pt-5">
      <Text className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-teal-300">
        {formatDisplayDate(localISODate())}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
        Hello, {firstName}
      </Text>
      <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Verify GPS, then record today’s attendance.
      </Text>

      <View
        className={`relative mt-6 rounded-3xl border bg-white p-5 dark:bg-slate-900 ${
          gpsReady
            ? 'border-emerald-200 dark:border-emerald-500/30'
            : 'border-amber-200 dark:border-amber-500/30'
        }`}>
        {gpsReady ? (
          <View className="absolute right-4 top-4">
            <Signal size={20} color="#059669" />
          </View>
        ) : null}
        <View className="flex-row items-start gap-3">
          <View
            className={`h-11 w-11 items-center justify-center rounded-full ${
              gpsReady
                ? 'bg-emerald-500'
                : 'bg-amber-50 dark:bg-amber-500/15'
            }`}>
            {gpsReady ? (
              <ShieldCheck size={20} color="#FFFFFF" />
            ) : (
              <ShieldAlert size={20} color="#B45309" />
            )}
          </View>
          <View className="min-w-0 flex-1 pr-8">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white">
              {gpsReady ? 'GPS verified' : 'GPS required'}
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {gpsLoading
                ? 'Requesting GPS location…'
                : gpsReady
                  ? `Location verified · ${formatCoords(gps.location.latitude, gps.location.longitude)}`
                  : gps
                    ? gps.message
                    : 'GPS has not been verified yet.'}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <Button
            title={gpsLoading ? 'Locating…' : 'Refresh location'}
            variant="secondary"
            disabled={gpsLoading}
            onPress={() => {
              refreshGps().catch(() => undefined);
            }}
          />
        </View>
      </View>

      {alreadyCheckedIn && todayRecord ? (
        <Pressable
          onPress={() => navigation.navigate('History')}
          className="mt-5">
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                Today’s check-in
              </Text>
              <ChevronRight size={20} color="#CBD5E1" />
            </View>
            <View className="mt-3 flex-row items-center">
              <Clock size={16} color={muted} />
              <Text className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                {todayRecord.checkInTime}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center">
              <MapPin size={16} color={muted} />
              <Text className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                {formatCoords(todayRecord.latitude, todayRecord.longitude)}
              </Text>
            </View>
            <View
              className={`mt-3 flex-row items-start rounded-2xl px-3 py-2.5 ${
                geofence.zone === null
                  ? 'bg-slate-50 dark:bg-slate-800/80'
                  : outside
                    ? 'bg-rose-50 dark:bg-rose-500/10'
                    : 'bg-emerald-50 dark:bg-emerald-500/10'
              }`}>
              {outside ? (
                <MapPinOff size={16} color="#E11D48" />
              ) : (
                <MapPin size={16} color={geofence.zone === null ? '#94A3B8' : '#059669'} />
              )}
              <View className="ml-2 flex-1">
                <Text
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    geofence.zone === null
                      ? 'text-slate-400'
                      : outside
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                  {geofence.zone === null
                    ? 'Waiting for GPS'
                    : outside
                      ? 'Outside company premises'
                      : 'Inside company premises'}
                </Text>
                <Text className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  {geofence.zone === null
                    ? 'Live location is needed to confirm the boundary.'
                    : outside
                      ? 'You are outside the geofence boundary.'
                      : 'You are inside the geofence boundary.'}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ) : (
        <View className="mt-5">
          <Button
            title={gpsReady ? 'Check in now' : 'Check-in blocked'}
            loading={submitting}
            disabled={!gpsReady || gpsLoading}
            onPress={onCheckIn}
          />
        </View>
      )}

      <View className="mt-5">
        <GeofencePanel
          site={geofence.site}
          location={gps?.ok ? gps.location : null}
          gpsMessage={gps && !gps.ok ? gps.message : undefined}
          reading={geofence.reading}
          zone={geofence.zone}
          openEvent={geofence.openEvent}
          lastClosed={geofence.lastClosed}
          todayEvents={geofence.todayEvents}
          secondsOutside={geofence.secondsOutside}
          reasonSaving={geofence.reasonSaving}
          reasonError={geofence.reasonError}
          checkInTime={todayRecord?.checkInTime}
          checkInCreatedAt={todayRecord?.createdAt}
          onSubmitReason={geofence.submitReason}
        />
      </View>

      {geofence.syncError ? (
        <Text className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          {geofence.syncError}
        </Text>
      ) : null}

      {!gpsReady && !alreadyCheckedIn ? (
        <Text className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Check-in is disabled until a live GPS location can be obtained and verified.{' '}
          <Text
            className="font-semibold text-brand-700 dark:text-teal-300"
            onPress={() => navigation.navigate('Report')}>
            Report a problem
          </Text>
        </Text>
      ) : null}

      {message ? (
        <Text className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {message}
        </Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</Text>
      ) : null}
    </ScrollView>
  );
}
