import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {Clock3} from 'lucide-react-native';
import {Card} from '../components/Card';
import {StatusBadge} from '../components/StatusBadge';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../services/attendanceService';
import type {AttendanceRecord} from '../../shared/types';
import {formatDisplayDate} from '../../shared/dates';

export function HistoryScreen() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setError('');
    const history = await getAttendanceHistory(employee.authUid);
    setRecords(history);
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => setError('Unable to load attendance history.'))
        .finally(() => setLoading(false));
    }, [load]),
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

  return (
    <SafeAreaView className="flex-1 bg-ink-100">
      <FlatList
        data={records}
        keyExtractor={item => item.attendanceId}
        contentContainerClassName="px-6 pb-10 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-3xl font-bold text-ink-900">History</Text>
            <Text className="mt-1 text-base text-ink-500">
              Your verified attendance records.
            </Text>
            {error ? (
              <Text className="mt-3 text-sm text-red-600">{error}</Text>
            ) : null}
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
                  No attendance yet
                </Text>
                <Text className="mt-1 text-center text-sm text-ink-500">
                  After a successful GPS check-in, it will appear here.
                </Text>
              </View>
            </Card>
          )
        }
        renderItem={({item}) => (
          <View className="mb-3">
            <Card>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-ink-900">
                    {formatDisplayDate(item.checkInDate)}
                  </Text>
                  <Text className="mt-1 text-sm text-ink-500">
                    {item.checkInTime}
                  </Text>
                </View>
                <StatusBadge status={item.locationStatus} />
              </View>
              <Text className="mt-3 text-xs text-ink-400">
                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </Text>
              <Text className="mt-1 text-xs text-ink-400">
                ID {item.attendanceId.slice(0, 8)}
              </Text>
            </Card>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
