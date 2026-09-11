import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Clock3} from 'lucide-react-native';
import {Card} from '../components/Card';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../services/attendanceService';
import {listEmployeeBoundaryEvents} from '../services/boundaryEvents';
import type {AttendanceRecord, BoundaryEvent} from '../../shared/types';
import {formatDisplayDate} from '../../shared/dates';
import {formatDurationHuman, formatMeters} from '../../shared/geofence';
import {buildPremisesReport, premisesSummaryLine} from '../../shared/premisesReport';
import {
  attendanceLabel,
  buildPersonalMonthReport,
  clampMonth,
  currentMonthValue,
  formatMonthLabel,
  shiftMonth,
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

  const premises = useMemo(() => {
    if (!employee || loading) {
      return null;
    }
    return buildPremisesReport(events, records, month, employee.authUid);
  }, [employee, events, loading, month, records]);

  const checkInByDate = useMemo(() => {
    const byDate = new Map<string, AttendanceRecord>();
    for (const record of records) {
      if (!byDate.has(record.checkInDate) || record.locationStatus === 'Verified') {
        byDate.set(record.checkInDate, record);
      }
    }
    return byDate;
  }, [records]);

  function changeMonth(delta: number) {
    setMonth(current => clampMonth(shiftMonth(current, delta), minMonth, maxMonth));
  }

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
            <Text className="text-3xl font-bold text-ink-900">Attendance</Text>
            <Text className="mt-1 text-base text-ink-500">
              Present and absent weekdays. Weekends are not counted.
            </Text>
            <View className="mt-5 flex-row items-center rounded-2xl border border-ink-200 bg-white px-3 py-2">
              <Pressable
                onPress={() => changeMonth(-1)}
                disabled={month <= minMonth}
                className="h-10 w-10 items-center justify-center">
                <Text
                  className={`text-xl font-bold ${
                    month <= minMonth ? 'text-ink-300' : 'text-brand-800'
                  }`}>
                  ‹
                </Text>
              </Pressable>
              <Text className="flex-1 text-center text-base font-semibold text-ink-900">
                {formatMonthLabel(month)}
              </Text>
              <Pressable
                onPress={() => changeMonth(1)}
                disabled={month >= maxMonth}
                className="h-10 w-10 items-center justify-center">
                <Text
                  className={`text-xl font-bold ${
                    month >= maxMonth ? 'text-ink-300' : 'text-brand-800'
                  }`}>
                  ›
                </Text>
              </Pressable>
            </View>
            {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
            {report ? (
              <View className="mt-5 flex-row flex-wrap gap-3">
                <Stat label="Present" value={String(report.presentDays)} />
                <Stat label="Absent" value={String(report.absentDays)} />
                <Stat label="Working days" value={String(report.workingDays)} />
                <Stat label="Attendance" value={`${report.attendanceRate}%`} />
              </View>
            ) : null}
            {report && report.rejectedDays > 0 ? (
              <Text className="mt-3 text-xs text-amber-800">
                {report.rejectedDays} day{report.rejectedDays === 1 ? '' : 's'} had a
                rejected GPS check-in. Those still count as present.
              </Text>
            ) : null}
            {premises ? (
              <View className="mt-5">
                <Text className="mb-2 text-lg font-semibold text-ink-900">
                  Premises exits
                </Text>
                <Text className="mb-3 text-sm text-ink-500">
                  {premisesSummaryLine(premises)}
                </Text>
                {premises.rows.slice(0, 8).map(row => (
                  <View key={row.eventId} className="mb-3">
                    <Card>
                      <Text className="text-base font-semibold text-ink-900">
                        {formatDisplayDate(row.date)}
                      </Text>
                      <Text className="mt-1 text-sm text-ink-500">
                        {row.exitClock} → {row.open ? 'Still out' : row.returnClock ?? '—'}
                      </Text>
                      <Text className="mt-1 text-sm text-ink-500">
                        {formatDurationHuman(row.durationOutside)} ·{' '}
                        {formatMeters(row.distanceFromCentre)} from centre
                      </Text>
                      <Text className="mt-1 text-xs text-ink-400">
                        {formatMeters(row.distanceFromBoundary)} from boundary · {row.reason}
                      </Text>
                    </Card>
                  </View>
                ))}
              </View>
            ) : null}
            <Text className="mt-2 text-lg font-semibold text-ink-900">Daily record</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#0F4C5C" />
          ) : (
            <Card>
              <View className="items-center py-6">
                <Clock3 size={28} color="#8A9AA8" />
                <Text className="mt-3 text-base font-semibold text-ink-800">
                  No working days yet
                </Text>
                <Text className="mt-1 text-center text-sm text-ink-500">
                  {formatMonthLabel(month)} has no weekday attendance to show.
                </Text>
              </View>
            </Card>
          )
        }
        renderItem={({item}) => {
          const present = attendanceLabel(item.status) === 'Present';
          const rejected = item.status === 'Rejected';
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
                  <View
                    className={`rounded-full px-3 py-1 ${
                      rejected ? 'bg-amber-50' : present ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        rejected
                          ? 'text-amber-700'
                          : present
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                      }`}>
                      {item.status}
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

function Stat({label, value}: {label: string; value: string}) {
  return (
    <View className="min-w-[47%] flex-1 rounded-3xl bg-white p-4">
      <Text className="text-2xl font-bold text-brand-800">{value}</Text>
      <Text className="mt-0.5 text-xs text-ink-500">{label}</Text>
    </View>
  );
}
