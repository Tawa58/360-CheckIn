import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Avatar} from '../components/Avatar';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {useAuth} from '../context/AuthContext';
import {clearProfilePhoto, saveProfilePhoto} from '../services/profile';

export function SettingsScreen() {
  const {employee, refreshEmployee} = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!employee) {
    return null;
  }

  const profile = employee;

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
      await saveProfilePhoto(profile.employeeId, `data:image/jpeg;base64,${asset.base64}`);
      await refreshEmployee();
      setNotice('Profile photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that photo.');
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
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
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="px-4 pb-10 pt-5">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">Settings</Text>
      <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Add a photo for your profile. Theme is in the header.
      </Text>

      <View className="mt-6">
        <Card>
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Profile photo
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This image appears on your profile and in the admin employee list.
          </Text>
          <View className="mt-5 flex-row items-center gap-4">
            <Avatar name={profile.fullName} photoUrl={profile.photoUrl} size="lg" />
            <View className="min-w-0 flex-1">
              <Text className="truncate font-semibold text-slate-900 dark:text-white">
                {profile.fullName}
              </Text>
              <Text className="truncate text-sm text-slate-500">{profile.department}</Text>
            </View>
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
            <View className="mt-2">
              <Button
                title="Remove photo"
                variant="secondary"
                disabled={saving}
                onPress={() => {
                  onRemove().catch(() => undefined);
                }}
              />
            </View>
          ) : null}
          {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}
          {notice ? (
            <Text className="mt-4 text-sm font-medium text-emerald-700">{notice}</Text>
          ) : null}
        </Card>
      </View>
    </ScrollView>
  );
}
