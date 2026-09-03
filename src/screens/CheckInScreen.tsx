import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CalendarCheck, Clock} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {GpsBanner} from '../components/GpsBanner';
import {StatusBadge} from '../components/StatusBadge';
import {useAuth} from '../context/AuthContext';
import {
  getTodayAttendance,
  submitCheckIn,
} from '../services/attendanceService';
import {getVerifiedLocation, type LocationResult} from '../services/locationService';
import type {AttendanceRecord} from '../../shared/types';
import {formatDisplayDate, localISODate} from '../../shared/dates';

export function CheckInScreen() {
  const {employee} = useAuth();
  const [gps, setGps] = useState<LocationResult | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = employee?.fullName.split(' ')[0] ?? 'there';
  const gpsReady = gps?.ok === true;
  const alreadyCheckedIn = Boolean(todayRecord);

  const refreshGps = useCallback(async () => {
    setGpsLoading(true);
    setError('');
    const result = await getVerifiedLocation();
    setGps(result);
    setGpsLoading(false);
    return result;
  }, []);

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
    <SafeAreaView className="flex-1 bg-ink-100">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Text className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          {formatDisplayDate(localISODate())}
        </Text>
        <Text className="mt-1 text-3xl font-bold text-ink-900">
          Hello, {firstName}
        </Text>
        <Text className="mt-1 text-base text-ink-500">
          Verify GPS, then record today’s attendance.
        </Text>

        <View className="mt-6">
          <GpsBanner gps={gps} loading={gpsLoading} onRetry={refreshGps} />
        </View>

        {alreadyCheckedIn && todayRecord ? (
          <View className="mt-5">
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink-900">
                  Today’s check-in
                </Text>
                <StatusBadge status={todayRecord.locationStatus} />
              </View>
              <View className="mt-4 flex-row items-center">
                <Clock size={16} color="#5B6B7A" />
                <Text className="ml-2 text-sm text-ink-500">
                  {todayRecord.checkInTime}
                </Text>
              </View>
              <Text className="mt-2 text-sm text-ink-500">
                {todayRecord.latitude.toFixed(6)}, {todayRecord.longitude.toFixed(6)}
              </Text>
            </Card>
          </View>
        ) : null}

        <View className="mt-5">
          <Button
            title={
              alreadyCheckedIn
                ? 'Already checked in'
                : gpsReady
                  ? 'Check in now'
                  : 'Check-in blocked'
            }
            loading={submitting}
            disabled={!gpsReady || alreadyCheckedIn || gpsLoading}
            onPress={onCheckIn}
          />
        </View>

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
