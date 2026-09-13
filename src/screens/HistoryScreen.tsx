import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Clock3} from 'lucide-react-native';
import {Card} from '../components/Card';
import {MonthPicker} from '../components/MonthPicker';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../services/attendanceService';
import {listEmployeeBoundaryEvents} from '../services/boundaryEvents';
import type {AttendanceRecord, BoundaryEvent} from '../../shared/types';
import {formatDisplayDate, localTime} from '../../shared/dates';
import {formatDurationHuman, formatMeters} from '../../shared/geofence';
import {
  attendanceLabel,
  buildPersonalMonthReport,
  currentMonthValue,
  type PersonalDay,
} from '../../shared/personalAttendance';

export function HistoryScreen() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<BoundaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(currentMonthValue());

  const minMonth = employee?.createdAt.slice(0, 7) ?? currentMonthValue();
  const maxMonth = currentMonthValue();

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setError('');
    setRecords(await getAttendanceHistory(employee.authUid));
    try {
      setEvents(await listEmployeeBoundaryEvents(employee.authUid));
    } catch {
      setEvents([]);
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => setError('Unable to load attendance history.'))
        .finally(() => setLoading(false));
    }, [load]),
  );

  const report = useMemo(() => {
    if (!employee || loading) {
      return null;
    }
    return buildPersonalMonthReport(employee, records, month);
  }, [employee, loading, month, records]);

  const checkInByDate = useMemo(() => {
    const byDate = new Map<string, AttendanceRecord>();
    for (const record of records) {
      if (!byDate.has(record.checkInDate) || record.locationStatus === 'Verified') {
        byDate.set(record.checkInDate, record);
      }
    }
    return byDate;
  }, [records]);

  const monthExits = useMemo(
    () => events.filter(event => event.eventDate.startsWith(month)).slice(0, 8),
    [events, month],
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch {
      setError('Unable to load attendance history.');
    } finally {
      setRefreshing(false);
    }
  }

  const days = report?.days ?? [];

  return (
    <FlatList
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      data={days}
      keyExtractor={(item: PersonalDay) => item.date}
      contentContainerClassName="px-4 pb-10 pt-5"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View className="mb-5">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            History
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Present and absent weekdays for the month.
          </Text>
          <MonthPicker
            month={month}
            minMonth={minMonth}
            maxMonth={maxMonth}
            onChange={setMonth}
          />
          {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}
          {report ? (
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1 rounded-3xl border border-ink-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {report.presentDays}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Present</Text>
              </View>
              <View className="flex-1 rounded-3xl border border-ink-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="text-2xl font-bold text-rose-600 dark:text-rose-300">
                  {report.absentDays}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Absent</Text>
              </View>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#0F4C5C" />
            <Text className="text-sm text-slate-500">Loading history…</Text>
          </View>
        ) : (
          <Card>
            <View className="items-center py-8">
              <Clock3 size={28} color="#94A3B8" />
              <Text className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                No working days yet
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                Weekday attendance will appear here after your start date.
              </Text>
            </View>
          </Card>
        )
      }
      ListFooterComponent={
        monthExits.length > 0 ? (
          <View className="mt-6">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              Premises exits
            </Text>
            {monthExits.map(event => (
              <View key={event.eventId} className="mt-3">
                <Card>
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(event.eventDate)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {localTime(new Date(event.exitTime))} →{' '}
                    {event.returnTime ? localTime(new Date(event.returnTime)) : 'Still out'}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {formatDurationHuman(event.durationOutside ?? 0)} ·{' '}
                    {formatMeters(event.maxDistanceFromCentre)} from centre
                  </Text>
                  <Text className="mt-1 text-xs text-slate-400">
                    {formatMeters(event.maxDistanceFromBoundary)} from boundary
                    {event.reason ? ` · ${event.reason}` : ''}
                  </Text>
                </Card>
              </View>
            ))}
          </View>
        ) : null
      }
      renderItem={({item}) => {
        const present = attendanceLabel(item.status) === 'Present';
        const checkIn = checkInByDate.get(item.date);
        return (
          <View className="mb-2">
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(item.date)}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {item.weekday}
                    {present && checkIn ? ` · ${checkIn.checkInTime}` : ''}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2.5 py-1 ${
                    present
                      ? 'bg-emerald-50 dark:bg-emerald-500/15'
                      : 'bg-rose-50 dark:bg-rose-500/15'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      present
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}>
                    {present ? 'Present' : 'Absent'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        );
      }}
    />
  );
}
