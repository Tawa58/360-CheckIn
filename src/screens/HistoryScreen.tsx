import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Clock3} from 'lucide-react-native';
import {Card} from '../components/Card';
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
  const month = currentMonthValue();

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setError('');
    const history = await getAttendanceHistory(employee.authUid);
    setRecords(history);
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
    <SafeAreaView className="flex-1 bg-ink-100">
      <FlatList
        data={days}
        keyExtractor={(item: PersonalDay) => item.date}
        contentContainerClassName="px-6 pb-10 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-3xl font-bold text-ink-900">History</Text>
            <Text className="mt-1 text-base text-ink-500">
              Present and absent weekdays for the month.
            </Text>
            {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
            {report ? (
              <View className="mt-5 flex-row gap-3">
                <View className="flex-1 rounded-3xl bg-white p-4">
                  <Text className="text-2xl font-bold text-emerald-700">{report.presentDays}</Text>
                  <Text className="mt-0.5 text-xs text-ink-500">Present</Text>
                </View>
                <View className="flex-1 rounded-3xl bg-white p-4">
                  <Text className="text-2xl font-bold text-rose-600">{report.absentDays}</Text>
                  <Text className="mt-0.5 text-xs text-ink-500">Absent</Text>
                </View>
              </View>
            ) : null}
            {events.length > 0 ? (
              <View className="mt-5">
                <Text className="mb-3 text-lg font-semibold text-ink-900">Premises exits</Text>
                {events
                  .filter(event => event.eventDate.startsWith(month))
                  .slice(0, 8)
                  .map(event => (
                    <View key={event.eventId} className="mb-3">
                      <Card>
                        <Text className="text-base font-semibold text-ink-900">
                          {formatDisplayDate(event.eventDate)}
                        </Text>
                        <Text className="mt-1 text-sm text-ink-500">
                          {localTime(new Date(event.exitTime))} →{' '}
                          {event.returnTime ? localTime(new Date(event.returnTime)) : 'Still out'}
                        </Text>
                        <Text className="mt-1 text-sm text-ink-500">
                          {formatDurationHuman(event.durationOutside ?? 0)} ·{' '}
                          {formatMeters(event.maxDistanceFromCentre)} from centre
                        </Text>
                        <Text className="mt-1 text-xs text-ink-400">
                          {formatMeters(event.maxDistanceFromBoundary)} from boundary
                          {event.reason ? ` · ${event.reason}` : ''}
                        </Text>
                      </Card>
                    </View>
                  ))}
              </View>
            ) : null}
            <Text className="mt-2 text-lg font-semibold text-ink-900">Attendance</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#0F4C5C" />
          ) : (
            <Card>
              <View className="items-center py-6">
                <Clock3 size={28} color="#8A9AA8" />
                <Text className="mt-3 text-base font-semibold text-ink-800">No working days yet</Text>
                <Text className="mt-1 text-center text-sm text-ink-500">
                  Weekday attendance will appear here after your start date.
                </Text>
              </View>
            </Card>
          )
        }
        renderItem={({item}) => {
          const present = attendanceLabel(item.status) === 'Present';
          const checkIn = checkInByDate.get(item.date);
          return (
            <View className="mb-2">
              <Card>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-ink-900">
                      {formatDisplayDate(item.date)}
                    </Text>
                    <Text className="mt-1 text-xs text-ink-400">
                      {item.weekday}
                      {present && checkIn ? ` · ${checkIn.checkInTime}` : ''}
                    </Text>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${present ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <Text className={`text-xs font-semibold ${present ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {present ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
