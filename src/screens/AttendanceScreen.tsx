import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {CalendarDays} from 'lucide-react-native';
import {Card} from '../components/Card';
import {MonthPicker} from '../components/MonthPicker';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../services/attendanceService';
import {listEmployeeBoundaryEvents} from '../services/boundaryEvents';
import type {AttendanceRecord, BoundaryEvent} from '../../shared/types';
import {formatDisplayDate} from '../../shared/dates';
import {formatDurationHuman, formatMeters} from '../../shared/geofence';
import {buildPremisesReport, premisesSummaryLine} from '../../shared/premisesReport';
import {
  buildPersonalMonthReport,
  currentMonthValue,
  formatMonthLabel,
  type PersonalDay,
} from '../../shared/personalAttendance';

function statusClass(status: string) {
  if (status === 'Present') {
    return {bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300'};
  }
  if (status === 'Rejected') {
    return {bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300'};
  }
  return {bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300'};
}

export function AttendanceScreen() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<BoundaryEvent[]>([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Unable to load your attendance.');
        })
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

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your attendance.');
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
            Attendance report
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Weekday check-ins for the month. Weekends are not counted.
          </Text>
          <MonthPicker
            month={month}
            minMonth={minMonth}
            maxMonth={maxMonth}
            onChange={setMonth}
          />
          {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}
          {report ? (
            <View className="mt-5 flex-row flex-wrap gap-3">
              <Stat label="Present" value={String(report.presentDays)} />
              <Stat label="Absent" value={String(report.absentDays)} />
              <Stat label="Working days" value={String(report.workingDays)} />
              <Stat label="Attendance" value={`${report.attendanceRate}%`} />
            </View>
          ) : null}
          {report && report.rejectedDays > 0 ? (
            <Text className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              {report.rejectedDays} day{report.rejectedDays === 1 ? '' : 's'} had a
              rejected GPS check-in. Those still count as present.
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color="#0F4C5C" />
        ) : (
          <Card>
            <View className="items-center py-8">
              <CalendarDays size={28} color="#94A3B8" />
              <Text className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                No working days yet
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                {formatMonthLabel(month)} has no weekday attendance to show.
              </Text>
            </View>
          </Card>
        )
      }
      ListFooterComponent={
        premises ? (
          <View className="mt-6">
            <Card>
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                Premises exits
              </Text>
              <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {premisesSummaryLine(premises)}
              </Text>
              {premises.rows.length === 0 ? (
                <Text className="mt-4 text-sm text-slate-500">
                  No exits recorded this month.
                </Text>
              ) : (
                premises.rows.map(row => (
                  <View
                    key={row.eventId}
                    className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                    <Text className="font-semibold text-slate-900 dark:text-white">
                      {formatDisplayDate(row.date)}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {row.exitClock} → {row.open ? 'Still out' : row.returnClock ?? '—'}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {formatDurationHuman(row.durationOutside)} ·{' '}
                      {formatMeters(row.distanceFromCentre)} from centre
                    </Text>
                    <Text className="mt-1 text-xs text-slate-400">
                      {formatMeters(row.distanceFromBoundary)} from boundary · {row.reason}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </View>
        ) : null
      }
      renderItem={({item}) => {
        const style = statusClass(item.status);
        return (
          <View className="mb-2">
            <Card>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(item.date)}
                  </Text>
                  <Text className="text-xs text-slate-400">{item.weekday}</Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${style.bg}`}>
                  <Text className={`text-xs font-semibold ${style.text}`}>{item.status}</Text>
                </View>
              </View>
            </Card>
          </View>
        );
      }}
    />
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <View className="min-w-[47%] flex-1 rounded-3xl border border-ink-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Text className="text-2xl font-bold text-brand-800 dark:text-teal-200">{value}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">{label}</Text>
    </View>
  );
}
