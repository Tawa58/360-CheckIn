import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CalendarCheck, Clock, MapPin, MapPinOff} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {GpsBanner} from '../components/GpsBanner';
import {ScreenHeader} from '../components/ScreenHeader';
import {useAuth} from '../context/AuthContext';
import {
  getTodayAttendance,
  submitCheckIn,
} from '../services/attendanceService';
import {useGeofenceMonitor} from '../hooks/useGeofenceMonitor';
import {GeofencePanel} from '../components/GeofencePanel';
import type {AttendanceRecord} from '../../shared/types';
import {formatDisplayDate, localISODate} from '../../shared/dates';

export function CheckInScreen() {
  const {employee} = useAuth();
  const geofence = useGeofenceMonitor(employee);
  const {gps, gpsLoading, refreshGps} = geofence;
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = employee?.fullName.split(' ')[0] ?? 'there';
  const gpsReady = gps?.ok === true;
  const alreadyCheckedIn = Boolean(todayRecord);

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
    <SafeAreaView className="flex-1 bg-ink-100 dark:bg-slate-950">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <ScreenHeader />
        <Text className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-teal-300">
          {formatDisplayDate(localISODate())}
        </Text>
        <Text className="mt-1 text-3xl font-bold text-ink-900 dark:text-white">
          Hello, {firstName}
        </Text>
        <Text className="mt-1 text-base text-ink-500 dark:text-slate-400">
          Verify GPS, then record today’s attendance.
        </Text>

        <View className="mt-6">
          <GpsBanner gps={gps} loading={gpsLoading} onRetry={refreshGps} />
        </View>

        {alreadyCheckedIn && todayRecord ? (
          <View className="mt-5">
            <Card>
              <Text className="text-base font-semibold text-ink-900">Today’s check-in</Text>
              <View className="mt-4 flex-row items-center">
                <Clock size={16} color="#5B6B7A" />
                <Text className="ml-2 text-sm text-ink-500">{todayRecord.checkInTime}</Text>
              </View>
              <View className="mt-2 flex-row items-center">
                <MapPin size={16} color="#5B6B7A" />
                <Text className="ml-2 text-sm text-ink-500">
                  {todayRecord.latitude.toFixed(5)}, {todayRecord.longitude.toFixed(5)}
                </Text>
              </View>
              <View
                className={`mt-3 flex-row items-start rounded-2xl px-3 py-2.5 ${
                  geofence.zone === null
                    ? 'bg-slate-50'
                    : geofence.zone === 'outside'
                      ? 'bg-rose-50'
                      : 'bg-emerald-50'
                }`}>
                {geofence.zone === 'outside' ? (
                  <MapPinOff size={16} color="#E11D48" />
                ) : (
                  <MapPin size={16} color={geofence.zone === null ? '#94A3B8' : '#059669'} />
                )}
                <View className="ml-2 flex-1">
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      geofence.zone === null
                        ? 'text-ink-400'
                        : geofence.zone === 'outside'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                    }`}>
                    {geofence.zone === null
                      ? 'Waiting for GPS'
                      : geofence.zone === 'outside'
                        ? 'Outside company premises'
                        : 'Inside company premises'}
                  </Text>
                  <Text className="mt-0.5 text-[11px] leading-4 text-ink-500">
                    {geofence.zone === null
                      ? 'Live location is needed to confirm the boundary.'
                      : geofence.zone === 'outside'
                        ? 'You are outside the geofence boundary.'
                        : 'You are inside the geofence boundary.'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {!alreadyCheckedIn ? (
          <View className="mt-5">
            <Button
              title={gpsReady ? 'Check in now' : 'Check-in blocked'}
              loading={submitting}
              disabled={!gpsReady || gpsLoading}
              onPress={onCheckIn}
            />
          </View>
        ) : null}

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
          <Text className="mt-3 text-sm text-amber-700">{geofence.syncError}</Text>
        ) : null}

        {!gpsReady && !alreadyCheckedIn ? (
          <View className="mt-4 flex-row items-start rounded-2xl bg-white p-4">
            <CalendarCheck size={18} color="#C44E0A" />
            <Text className="ml-2 flex-1 text-sm leading-5 text-ink-500">
              Check-in is disabled until a live GPS location can be obtained and
              verified.
            </Text>
          </View>
        ) : null}

        {message ? (
          <Text className="mt-4 text-sm font-medium text-emerald-700">
            {message}
          </Text>
        ) : null}
        {error ? (
          <Text className="mt-4 text-sm text-red-600">{error}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
