import {useEffect, useState, type FormEvent} from 'react';
import {CalendarCheck} from 'lucide-react';
import type {BoundaryEvent, GeofenceSite} from '@shared/types';
import {
  formatDurationClock,
  formatDurationHuman,
  formatDurationShort,
  type GeofenceReading,
  type PremisesZone,
} from '@shared/geofence';
import {localTime} from '@shared/dates';
import {VicinityMap} from './VicinityMap';
import {ExitReasonModal} from './ExitReasonModal';

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
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [checkInCreatedAt]);

  async function submitReason(event: FormEvent) {
    event.preventDefault();
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
    <div className="mt-5">
      {site ? (
        <VicinityMap
          site={site}
          location={location}
          outside={outside}
          muted={awaitingGps}
          reading={reading}
        />
      ) : (
        <div className="flex h-72 items-center justify-center rounded-[1.6rem] bg-emerald-50 text-sm text-slate-500 dark:bg-emerald-500/10">
          Loading vicinity map…
        </div>
      )}

      {!location && gpsMessage ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{gpsMessage}</p>
      ) : null}

      {openEvent ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Time out
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatDurationClock(secondsOutside)}
            </p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Left at
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {clock(openEvent.exitTime)}
            </p>
          </div>
        </div>
      ) : checkInTime ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <CalendarCheck className="h-3.5 w-3.5" />
              Checked in at
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {checkInTime}
            </p>
          </div>
          <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <CalendarCheck className="h-3.5 w-3.5" />
              Today’s total time
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatDurationShort(todaySeconds)}
            </p>
          </div>
        </div>
      ) : lastClosed ? (
        <p className="mt-4 text-sm text-slate-500">
          Returned {clock(lastClosed.returnTime)} · {formatDurationHuman(lastClosed.durationOutside ?? 0)}{' '}
          outside
        </p>
      ) : null}

      {openEvent?.reason ? (
        <p className="mt-3 text-sm text-slate-500">
          Reason: <span className="font-medium text-slate-800 dark:text-slate-200">{openEvent.reason}</span>
        </p>
      ) : null}

      {needsReason && reasonDismissed ? (
        <button
          type="button"
          className="btn-outline mt-3 w-full"
          onClick={() => setReasonDismissed(false)}>
          Add reason
        </button>
      ) : null}

      {needsReason && !reasonDismissed ? (
        <ExitReasonModal
          firstName={openEvent?.fullName.split(' ')[0] || 'there'}
          secondsOutside={formatDurationClock(secondsOutside)}
          leftAt={clock(openEvent?.exitTime)}
          reason={reason}
          reasonNote={reasonNote}
          reasonSaving={reasonSaving}
          reasonError={reasonError}
          onReasonChange={setReason}
          onReasonNoteChange={setReasonNote}
          onSubmit={submitReason}
          onClose={() => setReasonDismissed(true)}
        />
      ) : null}
    </div>
  );
}
