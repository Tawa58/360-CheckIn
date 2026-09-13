import React, {useCallback, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Button} from '../components/Button';
import {Card} from '../components/Card';
import {useAuth} from '../context/AuthContext';
import {
  ABSENCE_CATEGORIES,
  ISSUE_CATEGORIES,
  listMyMessages,
  submitEmployeeMessage,
} from '../services/messages';
import type {EmployeeMessage, EmployeeMessageKind} from '../../shared/types';
import {formatDisplayDate, formatDisplayDateTime, localISODate} from '../../shared/dates';

const TABS: {id: EmployeeMessageKind; label: string; hint: string}[] = [
  {
    id: 'absence',
    label: 'Absence notice',
    hint: 'Tell admin why you will not be in, or why you missed a day.',
  },
  {
    id: 'issue',
    label: 'System issue',
    hint: 'Report an app error, failed check-in, GPS problem, or access-code issue.',
  },
];

const STATUS_STYLE = {
  open: {
    bg: 'bg-amber-50 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Open',
  },
  seen: {
    bg: 'bg-sky-50 dark:bg-sky-500/15',
    text: 'text-sky-700 dark:text-sky-300',
    label: 'Seen',
  },
  resolved: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Resolved',
  },
} as const;

export function ReportScreen() {
  const {employee} = useAuth();
  const [kind, setKind] = useState<EmployeeMessageKind>('absence');
  const [category, setCategory] = useState<string>(ABSENCE_CATEGORIES[0]);
  const [absenceDate, setAbsenceDate] = useState(localISODate());
  const [details, setDetails] = useState('');
  const [messages, setMessages] = useState<EmployeeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setMessages(await listMyMessages(employee.authUid));
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => setError('Unable to load your recent reports.'))
        .finally(() => setLoading(false));
    }, [load]),
  );

  const categories = kind === 'absence' ? ABSENCE_CATEGORIES : ISSUE_CATEGORIES;
  const activeTab = useMemo(() => TABS.find(tab => tab.id === kind), [kind]);

  function switchKind(next: EmployeeMessageKind) {
    setKind(next);
    setCategory(next === 'absence' ? ABSENCE_CATEGORIES[0] : ISSUE_CATEGORIES[0]);
    setError('');
    setNotice('');
  }

  function shiftAbsenceDate(delta: number) {
    const [year, month, day] = absenceDate.split('-').map(Number);
    const next = new Date(year, month - 1, day + delta);
    const today = localISODate();
    const iso = localISODate(next);
    const min = employee?.createdAt.slice(0, 10) ?? iso;
    if (iso < min || iso > today) {
      return;
    }
    setAbsenceDate(iso);
  }

  async function onSubmit() {
    if (!employee) {
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const message = await submitEmployeeMessage({
        employee,
        kind,
        category,
        details,
        absenceDate: kind === 'absence' ? absenceDate : undefined,
      });
      setMessages(current => [message, ...current]);
      setDetails('');
      setNotice(
        kind === 'absence'
          ? 'Absence notice sent. Admin can see it in the inbox.'
          : 'Issue report sent. Admin can see it in the inbox.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-10 pt-5">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Send a report
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Absence notices and system issues go to the admin inbox.
        </Text>

        <View className="mt-5 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          {TABS.map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => switchKind(tab.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 ${
                kind === tab.id
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-transparent'
              }`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  kind === tab.id
                    ? 'text-brand-800 dark:text-teal-200'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {activeTab?.hint}
        </Text>

        <View className="mt-4">
          <Card>
            {kind === 'absence' ? (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Date away
                </Text>
                <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Pressable
                    onPress={() => shiftAbsenceDate(-1)}
                    className="h-10 w-10 items-center justify-center">
                    <Text className="text-xl font-bold text-brand-800 dark:text-teal-300">
                      ‹
                    </Text>
                  </Pressable>
                  <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(absenceDate)}
                  </Text>
                  <Pressable
                    onPress={() => shiftAbsenceDate(1)}
                    className="h-10 w-10 items-center justify-center">
                    <Text className="text-xl font-bold text-brand-800 dark:text-teal-300">
                      ›
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text
              className={`mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200 ${
                kind === 'absence' ? 'mt-5' : ''
              }`}>
              {kind === 'absence' ? 'Reason' : 'What went wrong'}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map(item => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  className={`rounded-full px-3 py-1.5 ${
                    category === item
                      ? 'bg-brand-800'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      category === item
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-2 mt-5 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Details
            </Text>
            <TextInput
              multiline
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
              className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder={
                kind === 'absence'
                  ? 'Add anything admin should know about this absence.'
                  : 'Describe the error, when it happened, and what you were trying to do.'
              }
              value={details}
              onChangeText={setDetails}
            />

            {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}
            {notice ? (
              <Text className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {notice}
              </Text>
            ) : null}

            <View className="mt-5">
              <Button
                title={kind === 'absence' ? 'Send absence notice' : 'Send issue report'}
                loading={submitting}
                onPress={() => {
                  onSubmit().catch(() => undefined);
                }}
              />
            </View>
          </Card>
        </View>

        <Text className="mb-1 mt-8 text-lg font-semibold text-slate-900 dark:text-white">
          Your reports
        </Text>
        <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Status updates after admin reviews them.
        </Text>
        {loading ? (
          <Text className="text-sm text-slate-500">Loading reports…</Text>
        ) : messages.length === 0 ? (
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            You have not sent a report yet.
          </Text>
        ) : (
          messages.map(message => {
            const status = STATUS_STYLE[message.status];
            return (
              <View key={message.messageId} className="mb-3">
                <Card>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 pr-2">
                      <Text className="text-base font-semibold text-slate-900 dark:text-white">
                        {message.kind === 'absence' ? 'Absence' : 'System issue'} ·{' '}
                        {message.category}
                      </Text>
                      {message.absenceDate ? (
                        <Text className="mt-0.5 text-xs text-slate-400">
                          Away {formatDisplayDate(message.absenceDate)}
                        </Text>
                      ) : null}
                    </View>
                    <View className={`rounded-full px-3 py-1 ${status.bg}`}>
                      <Text className={`text-xs font-semibold ${status.text}`}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {message.details}
                  </Text>
                  <Text className="mt-2 text-xs text-slate-400">
                    Sent {formatDisplayDateTime(message.createdAt)}
                  </Text>
                </Card>
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
