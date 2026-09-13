import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ShieldCheck} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {Logo} from '../components/Logo';
import {ThemeToggle} from '../components/ThemeToggle';
import {useAuth} from '../context/AuthContext';
import {firebaseReady} from '../config/firebase';

export function LoginScreen() {
  const {login} = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      await login(username, password, accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-800 dark:bg-slate-950">
      <StatusBar barStyle="light-content" backgroundColor="#0F4C5C" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
            <Logo variant="light" />
            <ThemeToggle lightOnDark />
          </View>
          <View className="px-6 pb-8 pt-6">
            <Text className="text-3xl font-bold text-white">CheckIn360</Text>
            <Text className="mt-2 text-base text-white/80">
              Daily attendance with verified GPS location.
            </Text>
          </View>

          <View className="flex-1 rounded-t-[32px] bg-ink-100 px-6 pb-10 pt-8 dark:bg-slate-900">
            <Text className="text-xl font-bold text-ink-900 dark:text-white">
              Employee login
            </Text>
            <Text className="mt-1 text-sm text-ink-500 dark:text-slate-400">
              Use your username, password, and issued access code.
            </Text>

            {!firebaseReady ? (
              <View className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <Text className="text-sm font-semibold text-amber-900">
                  Firebase is not configured
                </Text>
                <Text className="mt-2 text-sm leading-5 text-amber-800">
                  Add your Firebase web credentials in .env, enable
                  Email/Password auth, and create Firestore.
                </Text>
              </View>
            ) : null}

            <View className="mt-6 gap-4">
              <Input
                label="Username"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="msekiwa"
              />
              <Input
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
              />
              <Input
                label="Access code"
                autoCapitalize="characters"
                autoCorrect={false}
                value={accessCode}
                onChangeText={setAccessCode}
                placeholder="EMP-7XQ92K"
              />
            </View>

            {error ? (
              <Text className="mt-4 text-sm text-red-600">{error}</Text>
            ) : null}

            <View className="mt-6">
              <Button
                title="Sign in"
                loading={loading}
                disabled={!firebaseReady}
                onPress={onSubmit}
              />
            </View>

            <View className="mt-6 flex-row items-start">
              <ShieldCheck size={18} color="#16697A" />
              <Text className="ml-2 flex-1 text-sm leading-5 text-ink-500 dark:text-slate-400">
                Check-in stays locked until this device can verify a live GPS
                position.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
