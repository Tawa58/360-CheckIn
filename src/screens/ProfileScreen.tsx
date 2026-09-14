import React, {useState} from 'react';
import {Alert, Pressable, ScrollView, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Camera, KeyRound, LogOut} from 'lucide-react-native';
import {Avatar} from '../components/Avatar';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {useAuth} from '../context/AuthContext';
import {saveProfilePhoto} from '../services/profile';
import {daysUntil, formatExpiry, isExpired} from '../../shared/dates';

export function ProfileScreen() {
  const {employee, logout, refreshEmployee} = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!employee) {
    return null;
  }

  const profile = employee;
  const expired = isExpired(profile.codeExpiry);
  const remaining = daysUntil(profile.codeExpiry);

  async function onPickPhoto() {
    setError('');
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 320,
      maxHeight: 320,
      includeBase64: true,
      selectionLimit: 1,
    });
    if (result.didCancel) {
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.base64) {
      setError(result.errorMessage || 'Unable to read that photo.');
      return;
    }
    setSaving(true);
    try {
      await saveProfilePhoto(profile.employeeId, `data:image/jpeg;base64,${asset.base64}`);
      await refreshEmployee();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="px-4 pb-10 pt-5">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Profile</Text>
      <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Employee access details for this device.
      </Text>

      <View className="mt-6">
        <Card>
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <Avatar name={profile.fullName} photoUrl={profile.photoUrl} size="lg" />
              <Pressable
                accessibilityLabel="Upload profile photo"
                disabled={saving}
                onPress={() => {
                  onPickPhoto().catch(() => undefined);
                }}
                className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full bg-brand-800">
                <Camera size={16} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="truncate text-2xl font-bold text-slate-900 dark:text-white">
                {profile.fullName}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">{profile.department}</Text>
              <Pressable
                disabled={saving}
                onPress={() => {
                  onPickPhoto().catch(() => undefined);
                }}>
                <Text className="mt-2 text-sm font-semibold text-brand-700 dark:text-teal-300">
                  {profile.photoUrl ? 'Change photo' : 'Upload photo'}
                </Text>
              </Pressable>
            </View>
          </View>
          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
          <View className="mt-5 gap-3">
            <Detail label="Employee ID" value={profile.employeeId} />
            <Detail label="Username" value={profile.username} />
            <Detail
              label="Email"
              value={profile.email || 'Add an email in Settings for login help'}
            />
          </View>
        </Card>
      </View>

      <View className="mt-4">
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <KeyRound size={16} color="#0F4C5C" />
              <Text className="ml-2 text-base font-semibold text-slate-900 dark:text-white">
                Access code
              </Text>
            </View>
            <View
              className={`rounded-full px-2.5 py-1 ${
                expired
                  ? 'bg-rose-50 dark:bg-rose-500/15'
                  : 'bg-emerald-50 dark:bg-emerald-500/15'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  expired
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}>
                {expired ? 'Expired' : 'Active'}
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <Text className="text-center text-2xl font-bold tracking-widest text-brand-800 dark:text-teal-200">
              {profile.accessCode}
            </Text>
          </View>
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Expires {formatExpiry(profile.codeExpiry)}
            {expired
              ? '. Ask admin to renew this code.'
              : ` · ${remaining} day${remaining === 1 ? '' : 's'} remaining.`}
          </Text>
        </Card>
      </View>

      <View className="mt-8">
        <Button
          title="Sign out"
          variant="secondary"
          onPress={() => {
            Alert.alert('Sign out', 'You will need your access code to sign in again.', [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: () => {
                  logout().catch(() => undefined);
                },
              },
            ]);
          }}
        />
        <View className="mt-3 flex-row items-center justify-center">
          <LogOut size={14} color="#94A3B8" />
          <Text className="ml-2 text-xs text-slate-400">
            You will need your access code to sign in again.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Detail({label, value}: {label: string; value: string}) {
  return (
    <View>
      <Text className="text-xs uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-1 text-base text-slate-800 dark:text-slate-200">{value}</Text>
    </View>
  );
}
