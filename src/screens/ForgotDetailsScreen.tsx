import React, {useCallback, useEffect, useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import {AlertCircle, ArrowLeft, Mail} from 'lucide-react-native';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {Logo} from '../components/Logo';
import {ThemeToggle} from '../components/ThemeToggle';
import {
  getForgotRequest,
  loadStoredForgotRequest,
  lookupForgotRequest,
  storedForgotEmail,
  submitForgotDetails,
} from '../services/forgotDetails';
import {FORGOT_ITEMS, type EmployeeMessage, type ForgotItem} from '../../shared/types';
import {formatDisplayDateTime} from '../../shared/dates';

export function ForgotDetailsScreen() {
  const navigation = useNavigation();
  const [forgotten, setForgotten] = useState<ForgotItem[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [details, setDetails] = useState('');
  const [request, setRequest] = useState<EmployeeMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshRequest = useCallback(async (message: EmployeeMessage | null) => {
    if (!message) {
      setRequest(null);
      return;
    }
    const latest = await getForgotRequest(message.messageId);
    setRequest(latest ?? message);
  }, []);

  useEffect(() => {
    storedForgotEmail()
      .then(setEmail)
      .catch(() => undefined);
    loadStoredForgotRequest()
      .then(setRequest)
      .catch(() => undefined);
  }, []);

  function toggleItem(item: ForgotItem) {
    setForgotten(current =>
      current.includes(item) ? current.filter(value => value !== item) : [...current, item],
    );
  }

  async function onSubmit() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const message = await submitForgotDetails({
        forgotten,
        email,
        fullName,
        username,
        details,
      });
      setRequest(message);
      setNotice('Request sent. Admin will reply here, or ask you to check this email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send that request.');
    } finally {
      setLoading(false);
    }
  }

  async function onLookup() {
    setError('');
    setNotice('');
    setLooking(true);
    try {
      const message = await lookupForgotRequest(email);
      if (!message) {
        setError('No forgot-details request was found for that email.');
        return;
      }
      await refreshRequest(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load that request.');
    } finally {
      setLooking(false);
    }
  }

  return (
    <SafeAreaView
      className="flex-1 bg-brand-900 dark:bg-slate-950"
      edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B3A42" />
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Pressable
            accessibilityLabel="Back to sign in"
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10">
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>
          <Logo variant="light" style={{height: 36, width: 150}} />
        </View>
        <ThemeToggle lightOnDark />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow px-5 pb-24 pt-3"
          showsVerticalScrollIndicator={false}>
          <View className="rounded-3xl bg-white p-5 dark:border dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Forgot details
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose what you forgot. Admin will reply here or send the details to your
              profile email.
            </Text>

            <Text className="mb-2 mt-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
              What did you forget?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FORGOT_ITEMS.map(item => {
                const selected = forgotten.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggleItem(item)}
                    className={`rounded-full px-3 py-1.5 ${
                      selected ? 'bg-brand-800' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-5 gap-4">
              <Input
                label="Profile email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
                leftIcon={<Mail size={20} color="#94A3B8" />}
              />
              <Input
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="msekiwa"
              />
              <Input
                label="Username, if you remember it"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                placeholder="msekiwa"
              />
              <Input
                label="Anything else admin should know"
                value={details}
                onChangeText={setDetails}
                placeholder="Department, employee ID, or last time you signed in"
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
            {notice ? (
              <Text className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {notice}
              </Text>
            ) : null}

            <View className="mt-5">
              <Button title="Send request" loading={loading} onPress={onSubmit} />
            </View>
            <View className="mt-2">
              <Button
                title="Check for a reply"
                variant="secondary"
                loading={looking}
                onPress={() => {
                  onLookup().catch(() => undefined);
                }}
              />
            </View>
          </View>

          {request ? (
            <View className="mt-4 rounded-3xl bg-white p-5 dark:border dark:border-slate-800 dark:bg-slate-900">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                Your request
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                Sent {formatDisplayDateTime(request.createdAt)} · {request.category}
              </Text>
              <Text className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {request.details}
              </Text>
              {request.adminReply ? (
                <View className="mt-4 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Admin reply
                  </Text>
                  <Text className="mt-2 text-sm text-slate-800 dark:text-slate-100">
                    {request.adminReply}
                  </Text>
                  {request.adminRepliedAt ? (
                    <Text className="mt-2 text-xs text-slate-400">
                      {formatDisplayDateTime(request.adminRepliedAt)}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  No reply yet. Admin can send details here or tell you to check this
                  email.
                </Text>
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
