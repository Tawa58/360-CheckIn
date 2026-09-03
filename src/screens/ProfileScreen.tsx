import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {KeyRound, LogOut} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {StatusBadge} from '../components/StatusBadge';
import {useAuth} from '../context/AuthContext';
import {daysUntil, formatExpiry, isExpired} from '../../shared/dates';

export function ProfileScreen() {
  const {employee, logout} = useAuth();

  if (!employee) {
    return null;
  }

  const expired = isExpired(employee.codeExpiry);
  const remaining = daysUntil(employee.codeExpiry);

  return (
    <SafeAreaView className="flex-1 bg-ink-100">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Text className="text-3xl font-bold text-ink-900">Profile</Text>
        <Text className="mt-1 text-base text-ink-500">
          Employee database access details.
        </Text>

        <View className="mt-6">
          <Card>
            <Text className="text-2xl font-bold text-ink-900">
              {employee.fullName}
            </Text>
            <Text className="mt-1 text-sm text-ink-500">
              {employee.department}
            </Text>
            <View className="mt-5 gap-3">
              <Detail label="Employee ID" value={employee.employeeId} />
              <Detail label="Username" value={employee.username} />
            </View>
          </Card>
        </View>

        <View className="mt-4">
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <KeyRound size={18} color="#0F4C5C" />
                <Text className="ml-2 text-base font-semibold text-ink-900">
                  Access code
                </Text>
              </View>
              <StatusBadge status={expired ? 'Expired' : 'Active'} />
            </View>
            <View className="mt-4 rounded-2xl bg-ink-100 px-4 py-3">
              <Text className="text-center text-2xl font-bold tracking-widest text-brand-800">
                {employee.accessCode}
              </Text>
            </View>
            <Text className="mt-3 text-sm text-ink-500">
              Expires {formatExpiry(employee.codeExpiry)}
              {expired
                ? '. Ask admin to renew this code.'
                : ` · ${remaining} day${remaining === 1 ? '' : 's'} remaining.`}
            </Text>
            <Text className="mt-2 text-xs leading-5 text-ink-400">
              This code was generated at registration and is not changed during
              daily check-in.
            </Text>
          </Card>
        </View>

        <View className="mt-8">
          <Button
            title="Sign out"
            variant="secondary"
            onPress={() => {
              logout().catch(() => undefined);
            }}
          />
          <View className="mt-3 flex-row items-center justify-center">
            <LogOut size={14} color="#8A9AA8" />
            <Text className="ml-2 text-xs text-ink-400">
              You will need your access code to sign in again.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({label, value}: {label: string; value: string}) {
  return (
    <View>
      <Text className="text-xs uppercase tracking-wide text-ink-400">
        {label}
      </Text>
      <Text className="mt-1 text-base text-ink-800">{value}</Text>
    </View>
  );
}
