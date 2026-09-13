import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AlertCircle, Eye, EyeOff, KeyRound, Lock, UserRound} from 'lucide-react-native';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <SafeAreaView
      className="flex-1 bg-brand-900 dark:bg-slate-950"
      edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3A42" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow justify-center px-5 py-8"
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 flex-row items-center justify-between">
            <Logo variant="light" style={{height: 40, width: 168}} />
            <ThemeToggle lightOnDark />
          </View>

          <View className="rounded-3xl bg-white p-5 dark:border dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Use your username, password, and issued access code.
            </Text>

            {!firebaseReady ? (
              <View className="mt-4 flex-row gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
                <AlertCircle size={20} color="#92400E" />
                <Text className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                  Add your Firebase web credentials in .env before checking in.
                </Text>
              </View>
            ) : null}

            <View className="mt-5 gap-4">
              <Input
                label="Username"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                value={username}
                onChangeText={setUsername}
                placeholder="msekiwa"
                leftIcon={<UserRound size={20} color="#94A3B8" />}
              />
              <Input
                label="Password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                leftIcon={<Lock size={20} color="#94A3B8" />}
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword(value => !value)}
                    className="h-9 w-9 items-center justify-center rounded-full">
                    {showPassword ? (
                      <EyeOff size={20} color="#94A3B8" />
                    ) : (
                      <Eye size={20} color="#94A3B8" />
                    )}
                  </Pressable>
                }
              />
              <Input
                label="Access code"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="one-time-code"
                value={accessCode}
                onChangeText={setAccessCode}
                placeholder="EMP-7XQ92K"
                leftIcon={<KeyRound size={20} color="#94A3B8" />}
              />
            </View>

            {error ? (
              <View className="mt-4 flex-row gap-3 rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
                <AlertCircle size={20} color="#B91C1C" />
                <Text className="flex-1 text-sm text-red-700 dark:text-red-300">
                  {error}
                </Text>
              </View>
            ) : null}

            <View className="mt-5">
              <Button
                title="Sign in"
                loading={loading}
                disabled={!firebaseReady}
                onPress={onSubmit}
              />
            </View>
          </View>

          <Text className="mt-6 px-2 text-center text-xs leading-5 text-white/50">
            Check-in stays locked until this device can verify a live GPS position.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
