import React, {useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {KeyRound, LogOut} from 'lucide-react-native';
import {Avatar} from '../components/Avatar';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {StatusBadge} from '../components/StatusBadge';
import {useAuth} from '../context/AuthContext';
import {clearProfilePhoto, saveProfilePhoto} from '../services/profile';
import {daysUntil, formatExpiry, isExpired} from '../../shared/dates';

export function ProfileScreen() {
  const {employee, logout, refreshEmployee} = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!employee) {
    return null;
  }

  const profile = employee;
  const expired = isExpired(profile.codeExpiry);
  const remaining = daysUntil(profile.codeExpiry);

  async function onPickPhoto() {
    setError('');
    setNotice('');
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
      await saveProfilePhoto(
        profile.employeeId,
        `data:image/jpeg;base64,${asset.base64}`,
      );
      await refreshEmployee();
      setNotice('Profile photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that photo.');
    } finally {
      setSaving(false);
    }
  }

  async function onRemovePhoto() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await clearProfilePhoto(profile.employeeId);
      await refreshEmployee();
      setNotice('Profile photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove the photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink-100">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Text className="text-3xl font-bold text-ink-900">Profile</Text>
        <Text className="mt-1 text-base text-ink-500">
          Your CheckIn360 access details and photo.
        </Text>

        <View className="mt-6">
          <Card>
            <View className="items-center">
              <Avatar name={profile.fullName} photoUrl={profile.photoUrl} size="lg" />
              <Text className="mt-4 text-2xl font-bold text-ink-900">
                {profile.fullName}
              </Text>
              <Text className="mt-1 text-sm text-ink-500">{profile.department}</Text>
            </View>
            <View className="mt-5 gap-3">
              <Detail label="Employee ID" value={profile.employeeId} />
              <Detail label="Username" value={profile.username} />
            </View>
            <View className="mt-5">
              <Button
                title={profile.photoUrl ? 'Replace photo' : 'Upload photo'}
                loading={saving}
                onPress={() => {
                  onPickPhoto().catch(() => undefined);
                }}
              />
            </View>
            {profile.photoUrl ? (
              <View className="mt-3">
                <Button
                  title="Remove photo"
                  variant="secondary"
                  disabled={saving}
                  onPress={() => {
                    onRemovePhoto().catch(() => undefined);
                  }}
                />
              </View>
            ) : null}
            {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
            {notice ? (
              <Text className="mt-3 text-sm font-medium text-emerald-700">{notice}</Text>
            ) : null}
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
                {profile.accessCode}
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
      <Text className="text-xs uppercase tracking-wide text-ink-400">{label}</Text>
      <Text className="mt-1 text-base text-ink-800">{value}</Text>
    </View>
  );
}
