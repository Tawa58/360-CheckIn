import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {Avatar} from '../components/Avatar';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {Input} from '../components/Input';
import {useAuth} from '../context/AuthContext';
import {clearProfilePhoto, saveProfileEmail, saveProfilePhoto} from '../services/profile';

export function SettingsScreen() {
  const {employee, refreshEmployee} = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState(employee?.email ?? '');

  if (!employee) {
    return null;
  }

  const profile = employee;

  async function onSaveEmail() {
    setSavingEmail(true);
    setError('');
    setNotice('');
    try {
      await saveProfileEmail(profile.employeeId, email);
      await refreshEmployee();
      setNotice('Email saved. It is only used if you forget your login details.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that email.');
    } finally {
      setSavingEmail(false);
    }
  }

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
        Add a photo and a contact email. Theme is in the header.
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

      <View className="mt-4">
        <Card>
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Contact email
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Used only if you forget your login details. Admin can reply in the app
            or send the details here.
          </Text>
          <View className="mt-5">
            <Input
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
            />
          </View>
          <View className="mt-4">
            <Button
              title="Save email"
              loading={savingEmail}
              onPress={() => {
                onSaveEmail().catch(() => undefined);
              }}
            />
          </View>
          {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}
          {notice ? (
            <Text className="mt-4 text-sm font-medium text-emerald-700">{notice}</Text>
          ) : null}
        </Card>
      </View>
    </ScrollView>
  );
}
