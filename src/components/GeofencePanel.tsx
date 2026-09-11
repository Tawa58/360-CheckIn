import React, {useEffect, useState} from 'react';
import {Modal, Pressable, Text, TextInput, View} from 'react-native';
import {CalendarCheck, Clock3, MapPinOff, X} from 'lucide-react-native';
import {EXIT_REASONS, type BoundaryEvent, type GeofenceSite} from '../../shared/types';
import {
  formatDurationClock,
  formatDurationHuman,
  formatDurationShort,
  type GeofenceReading,
  type PremisesZone,
} from '../../shared/geofence';
import {localTime} from '../../shared/dates';
import {VicinityMap} from './VicinityMap';
import {Button} from './Button';

type Props = {
  site: GeofenceSite | null;
  location: {latitude: number; longitude: number} | null;
  gpsMessage?: string;
  reading: GeofenceReading | null;
  zone: PremisesZone | null;
  openEvent: BoundaryEvent | null;
  lastClosed: BoundaryEvent | null;
  todayEvents: BoundaryEvent[];
  secondsOutside: number;
  reasonSaving: boolean;
  reasonError: string;
  checkInTime?: string;
  checkInCreatedAt?: string;
  onSubmitReason: (reason: string, reasonNote?: string) => Promise<void>;
};

function clock(iso?: string): string {
  if (!iso) {
    return '—';
  }
  return localTime(new Date(iso));
}

export function GeofencePanel({
  site,
  location,
  gpsMessage,
  reading,
  zone,
  openEvent,
  lastClosed,
  secondsOutside,
  reasonSaving,
  reasonError,
  checkInTime,
  checkInCreatedAt,
  onSubmitReason,
}: Props) {
  const outside = zone === 'outside';
  const awaitingGps = zone === null;
  const needsReason = Boolean(outside && openEvent && !openEvent.reason);
  const [reason, setReason] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [reasonDismissed, setReasonDismissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setReasonDismissed(false);
  }, [openEvent?.eventId]);

  useEffect(() => {
    if (!checkInCreatedAt) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [checkInCreatedAt]);

  async function submitReason() {
    const note = reasonNote.trim();
    if (!reason || (reason === 'Other' && !note)) {
      return;
    }
    try {
      await onSubmitReason(reason, note || undefined);
      setReason('');
      setReasonNote('');
    } catch {
      // reasonError is shown by the monitor hook.
    }
  }

  const todaySeconds = checkInCreatedAt
    ? Math.max(0, Math.floor((now - Date.parse(checkInCreatedAt)) / 1000))
    : 0;

  return (
    <View>
      {site ? (
        <VicinityMap
          site={site}
          location={location}
          outside={outside}
          muted={awaitingGps}
          reading={reading}
        />
      ) : (
        <View className="h-72 items-center justify-center rounded-3xl bg-emerald-50">
          <Text className="text-sm text-ink-500">Loading vicinity map…</Text>
        </View>
      )}

      {!location && gpsMessage ? (
        <Text className="mt-3 text-sm text-amber-700">{gpsMessage}</Text>
      ) : null}

      {openEvent ? (
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
              Time out
            </Text>
            <Text className="mt-2 text-2xl font-semibold text-ink-900">
              {formatDurationClock(secondsOutside)}
            </Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
              Left at
            </Text>
            <Text className="mt-2 text-2xl font-semibold text-ink-900">
              {clock(openEvent.exitTime)}
            </Text>
          </View>
        </View>
      ) : checkInTime ? (
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-white px-4 py-4">
            <View className="flex-row items-center">
              <CalendarCheck size={14} color="#94A3B8" />
              <Text className="ml-1 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                Checked in at
              </Text>
            </View>
            <Text className="mt-2 text-2xl font-semibold text-ink-900">{checkInTime}</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white px-4 py-4">
            <View className="flex-row items-center">
              <CalendarCheck size={14} color="#94A3B8" />
              <Text className="ml-1 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                Today’s total time
              </Text>
            </View>
            <Text className="mt-2 text-2xl font-semibold text-ink-900">
              {formatDurationShort(todaySeconds)}
            </Text>
          </View>
        </View>
      ) : lastClosed ? (
        <Text className="mt-4 text-sm text-ink-500">
          Returned {clock(lastClosed.returnTime)} ·{' '}
          {formatDurationHuman(lastClosed.durationOutside ?? 0)} outside
        </Text>
      ) : null}

      {openEvent?.reason ? (
        <Text className="mt-3 text-sm text-ink-500">Reason: {openEvent.reason}</Text>
      ) : null}

      {needsReason && reasonDismissed ? (
        <View className="mt-3">
          <Button title="Add reason" variant="secondary" onPress={() => setReasonDismissed(false)} />
        </View>
      ) : null}

      <Modal visible={needsReason && !reasonDismissed} transparent animationType="fade">
        <View className="flex-1 pt-16" pointerEvents="box-none">
          <View className="mx-6 min-h-[26.4rem] rounded-[28px] bg-white px-5 pb-12 pt-5 shadow-lg ring-1 ring-slate-200">
            <View className="flex-row items-start">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
                <MapPinOff size={20} color="#E11D48" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-rose-500">
                  Outside premises
                </Text>
                <Text className="mt-0.5 text-lg font-semibold text-ink-900">
                  {openEvent?.fullName.split(' ')[0] || 'there'}, why did you leave?
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setReasonDismissed(true)}
                className="-mr-1 h-9 w-9 items-center justify-center rounded-full">
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="mt-5 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-slate-50 px-3 py-3.5">
                <View className="flex-row items-center">
                  <Clock3 size={12} color="#94A3B8" />
                  <Text className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                    Time out
                  </Text>
                </View>
                <Text className="mt-1 text-lg font-semibold text-ink-900">
                  {formatDurationClock(secondsOutside)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-slate-50 px-3 py-3.5">
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                  Left at
                </Text>
                <Text className="mt-1 text-lg font-semibold text-ink-900">
                  {clock(openEvent?.exitTime)}
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row flex-wrap justify-between">
              {EXIT_REASONS.map(option => {
                const selected = reason === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setReason(option)}
                    className={`mb-2.5 h-[52px] w-[48%] items-center justify-center rounded-2xl px-2 ${
                      selected ? 'bg-brand-800' : 'bg-slate-50'
                    }`}>
                    <Text
                      className={`text-center text-sm font-medium ${
                        selected ? 'text-white' : 'text-ink-800'
                      }`}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {reason ? (
              <TextInput
                multiline
                textAlignVertical="top"
                value={reasonNote}
                onChangeText={setReasonNote}
                placeholder={reason === 'Other' ? 'Enter reason' : 'Extra detail (optional)'}
                placeholderTextColor="#8A9AA8"
                scrollEnabled={false}
                className="mt-1 min-h-[88px] rounded-2xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-900"
              />
            ) : null}

            {reasonError ? (
              <Text className="mt-2 text-sm text-red-600">{reasonError}</Text>
            ) : null}

            <View className="mt-5">
              <Button
                title={reasonSaving ? 'Saving…' : 'Submit reason'}
                loading={reasonSaving}
                disabled={!reason || (reason === 'Other' && !reasonNote.trim())}
                onPress={() => {
                  void submitReason();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
