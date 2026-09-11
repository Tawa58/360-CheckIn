import {useEffect, useMemo, useState} from 'react';
import {AlertCircle, CalendarDays, Loader2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../lib/attendance';
import {listEmployeeBoundaryEvents} from '../lib/boundaryEvents';
import {
  buildPersonalMonthReport,
  currentMonthValue,
  formatMonthLabel,
} from '../lib/myAttendance';
import type {AttendanceRecord, BoundaryEvent} from '@shared/types';
import {formatDisplayDate} from '@shared/dates';
import {buildPremisesReport, premisesSummaryLine} from '@shared/premisesReport';
import {formatDurationHuman, formatMeters} from '@shared/geofence';

function statusClass(status: string) {
  if (status === 'Present') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (status === 'Rejected') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
  return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
}

export function AttendancePage() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<BoundaryEvent[]>([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Attendance report · CheckIn360';
    if (!employee) {
      return;
    }
    getAttendanceHistory(employee.authUid)
      .then(setRecords)
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load your attendance.');
      })
      .finally(() => setLoading(false));
    listEmployeeBoundaryEvents(employee.authUid)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [employee]);

  const report = useMemo(() => {
    if (!employee || loading) {
      return null;
    }
    return buildPersonalMonthReport(employee, records, month);
  }, [employee, loading, month, records]);

  const premises = useMemo(() => {
    if (!employee || loading) {
      return null;
    }
    return buildPremisesReport(events, records, month, employee.authUid);
  }, [employee, events, loading, month, records]);

  const minMonth = employee
    ? employee.createdAt.slice(0, 7)
    : currentMonthValue();

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Attendance report
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Weekday check-ins for the month. Weekends are not counted.
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

      {error ? (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {loading || !report ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading report…
        </p>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Present" value={report.presentDays} />
            <Stat label="Absent" value={report.absentDays} />
            <Stat label="Working days" value={report.workingDays} />
            <Stat label="Attendance" value={`${report.attendanceRate}%`} />
          </section>

          {report.rejectedDays > 0 ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              {report.rejectedDays} day{report.rejectedDays === 1 ? '' : 's'} had a rejected
              GPS check-in. Those still count as present.
            </p>
          ) : null}

          {report.days.length === 0 ? (
            <section className="card mt-6 px-5 py-10 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                No working days yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatMonthLabel(month)} has no weekday attendance to show.
              </p>
            </section>
          ) : (
            <ul className="mt-6 space-y-2">
              {report.days.map(day => (
                <li
                  key={day.date}
                  className="card flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDisplayDate(day.date)}
                    </p>
                    <p className="text-xs text-slate-400">{day.weekday}</p>
                  </div>
                  <span className={`badge ${statusClass(day.status)}`}>{day.status}</span>
                </li>
              ))}
            </ul>
          )}

          {premises ? (
            <section className="card mt-6 overflow-hidden p-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Premises exits
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {premisesSummaryLine(premises)}
              </p>
              {premises.rows.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No exits recorded this month.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {premises.rows.map(row => (
                    <li key={row.eventId} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatDisplayDate(row.date)}
                      </p>
                      <p className="mt-1 text-sm tabular-nums text-slate-500">
                        {row.exitClock} → {row.open ? 'Still out' : row.returnClock ?? '—'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDurationHuman(row.durationOutside)} · {formatMeters(row.distanceFromCentre)} from centre
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatMeters(row.distanceFromBoundary)} from boundary · {row.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Stat({label, value}: {label: string; value: string | number}) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-bold tabular-nums text-brand-900 dark:text-brand-200">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
