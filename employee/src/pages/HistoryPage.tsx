import {useCallback, useEffect, useMemo, useState} from 'react';
import {Clock3, Loader2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../lib/attendance';
import {listEmployeeBoundaryEvents} from '../lib/boundaryEvents';
import {
  attendanceLabel,
  buildPersonalMonthReport,
  currentMonthValue,
} from '../lib/myAttendance';
import type {AttendanceRecord, BoundaryEvent} from '@shared/types';
import {formatDisplayDate, localTime} from '@shared/dates';
import {formatDurationHuman, formatMeters} from '@shared/geofence';

export function HistoryPage() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<BoundaryEvent[]>([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setError('');
    setRecords(await getAttendanceHistory(employee.authUid));
    try {
      setEvents(await listEmployeeBoundaryEvents(employee.authUid));
    } catch {
      setEvents([]);
    }
  }, [employee]);

  useEffect(() => {
    document.title = 'History · CheckIn360';
    setLoading(true);
    load()
      .catch(() => setError('Unable to load attendance history.'))
      .finally(() => setLoading(false));
  }, [load]);

  const report = useMemo(() => {
    if (!employee || loading) {
      return null;
    }
    return buildPersonalMonthReport(employee, records, month);
  }, [employee, loading, month, records]);

  const checkInByDate = useMemo(() => {
    const byDate = new Map<string, AttendanceRecord>();
    for (const record of records) {
      if (!byDate.has(record.checkInDate) || record.locationStatus === 'Verified') {
        byDate.set(record.checkInDate, record);
      }
    }
    return byDate;
  }, [records]);

  const minMonth = employee ? employee.createdAt.slice(0, 7) : currentMonthValue();

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        History
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Present and absent weekdays for the month.
      </p>

      <label className="mt-5 block">
        <span className="field-label">Month</span>
        <input
          type="month"
          className="field-input mt-1.5"
          min={minMonth}
          max={currentMonthValue()}
          value={month}
          onChange={event => setMonth(event.target.value)}
        />
      </label>

      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

      {loading || !report ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading history…
        </p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {report.presentDays}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Present</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-300">
                {report.absentDays}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Absent</p>
            </div>
          </section>

          {report.days.length === 0 ? (
            <section className="card mt-6 px-5 py-10 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                No working days yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Weekday attendance will appear here after your start date.
              </p>
            </section>
          ) : (
            <ul className="mt-6 space-y-2">
              {report.days.map(day => {
                const present = attendanceLabel(day.status) === 'Present';
                const checkIn = checkInByDate.get(day.date);
                return (
                  <li key={day.date} className="card flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatDisplayDate(day.date)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {day.weekday}
                        {present && checkIn ? ` · ${checkIn.checkInTime}` : ''}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        present
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                      }`}>
                      {present ? 'Present' : 'Absent'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {events.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Premises exits</h2>
              <ul className="mt-3 space-y-3">
                {events
                  .filter(event => event.eventDate.startsWith(month))
                  .slice(0, 8)
                  .map(event => (
                    <li key={event.eventId} className="card p-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatDisplayDate(event.eventDate)}
                      </p>
                      <p className="mt-1 text-sm tabular-nums text-slate-500">
                        {localTime(new Date(event.exitTime))} →{' '}
                        {event.returnTime ? localTime(new Date(event.returnTime)) : 'Still out'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDurationHuman(event.durationOutside ?? 0)} ·{' '}
                        {formatMeters(event.maxDistanceFromCentre)} from centre
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatMeters(event.maxDistanceFromBoundary)} from boundary
                        {event.reason ? ` · ${event.reason}` : ''}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
