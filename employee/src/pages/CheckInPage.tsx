import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarCheck, Clock, Loader2, MapPin, RefreshCw, ShieldAlert, ShieldCheck} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {getTodayAttendance, submitCheckIn} from '../lib/attendance';
import {getVerifiedLocation, type LocationResult} from '../lib/location';
import type {AttendanceRecord} from '@shared/types';
import {formatDisplayDate, localISODate} from '@shared/dates';

export function CheckInPage() {
  const {employee} = useAuth();
  const [gps, setGps] = useState<LocationResult | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = employee?.fullName.split(' ')[0] ?? 'there';
  const gpsReady = gps?.ok === true;
  const alreadyCheckedIn = Boolean(todayRecord);

  const refreshGps = useCallback(async () => {
    setGpsLoading(true);
    setError('');
    const result = await getVerifiedLocation();
    setGps(result);
    setGpsLoading(false);
    return result;
  }, []);

  const loadToday = useCallback(async () => {
    if (!employee) {
      return;
    }
    const record = await getTodayAttendance(employee.authUid);
    setTodayRecord(record);
  }, [employee]);

  useEffect(() => {
    document.title = 'Check in · CheckIn360';
    refreshGps();
    loadToday().catch(() => {
      setError('Unable to load today’s attendance.');
    });
  }, [loadToday, refreshGps]);

  async function onCheckIn() {
    if (!employee) {
      return;
    }
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const latestGps = await refreshGps();
      if (!latestGps.ok) {
        throw new Error(latestGps.message);
      }
      const record = await submitCheckIn(employee, latestGps.location);
      setTodayRecord(record);
      setMessage('Attendance saved. Location verified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
        {formatDisplayDate(localISODate())}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Hello, {firstName}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Verify GPS, then record today’s attendance.
      </p>

      <section
        className={`card mt-6 p-5 ${
          gpsReady
            ? 'border-emerald-200 dark:border-emerald-500/30'
            : 'border-amber-200 dark:border-amber-500/30'
        }`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              gpsReady
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
            }`}>
            {gpsReady ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {gpsReady ? 'GPS verified' : 'GPS required'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {gpsLoading
                ? 'Requesting GPS location…'
                : gpsReady
                  ? `Location verified · ${gps.location.latitude.toFixed(5)}, ${gps.location.longitude.toFixed(5)}`
                  : gps
                    ? gps.message
                    : 'GPS has not been verified yet.'}
            </p>
          </div>
        </div>
        <button type="button" className="btn-outline mt-4 w-full" disabled={gpsLoading} onClick={refreshGps}>
          {gpsLoading ? <MapPin className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          {gpsLoading ? 'Locating…' : 'Refresh location'}
        </button>
      </section>

      {alreadyCheckedIn && todayRecord ? (
        <section className="card mt-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Today’s check-in</h2>
            <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {todayRecord.locationStatus}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            {todayRecord.checkInTime}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {todayRecord.latitude.toFixed(6)}, {todayRecord.longitude.toFixed(6)}
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className="btn-primary mt-5 w-full"
        disabled={!gpsReady || alreadyCheckedIn || gpsLoading || submitting}
        onClick={onCheckIn}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
        {alreadyCheckedIn ? 'Already checked in' : gpsReady ? 'Check in now' : 'Check-in blocked'}
      </button>

      {!gpsReady && !alreadyCheckedIn ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Check-in is disabled until a live GPS location can be obtained and verified.{' '}
          <Link to="/report" className="font-semibold text-brand-700 dark:text-brand-300">
            Report a problem
          </Link>
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">{message}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
