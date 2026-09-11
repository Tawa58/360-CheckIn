import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MapPinOff,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Signal,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {getTodayAttendance, submitCheckIn} from '../lib/attendance';
import {useGeofenceMonitor} from '../lib/useGeofenceMonitor';
import {GeofencePanel} from '../components/GeofencePanel';
import type {AttendanceRecord} from '@shared/types';
import {formatDisplayDate, localISODate} from '@shared/dates';

function formatCoords(latitude: number, longitude: number): string {
  const eastWest = longitude >= 0 ? 'E' : 'W';
  return `${latitude.toFixed(5)}, ${Math.abs(longitude).toFixed(5)}${eastWest}`;
}

export function CheckInPage() {
  const {employee} = useAuth();
  const geofence = useGeofenceMonitor(employee);
  const {gps, gpsLoading, refreshGps} = geofence;
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = employee?.fullName.split(' ')[0] ?? 'there';
  const gpsReady = gps?.ok === true;
  const alreadyCheckedIn = Boolean(todayRecord);
  const outside = geofence.zone === 'outside';

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
        className={`card relative mt-6 p-5 ${
          gpsReady
            ? 'border-emerald-200 dark:border-emerald-500/30'
            : 'border-amber-200 dark:border-amber-500/30'
        }`}>
        {gpsReady ? (
          <Signal className="absolute right-4 top-4 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
        ) : null}
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              gpsReady
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
            }`}>
            {gpsReady ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </span>
          <div className="min-w-0 pr-8">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {gpsReady ? 'GPS verified' : 'GPS required'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {gpsLoading
                ? 'Requesting GPS location…'
                : gpsReady
                  ? `Location verified · ${formatCoords(gps.location.latitude, gps.location.longitude)}`
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
        <Link
          to="/history"
          className="card mt-5 flex items-center gap-3 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Today’s check-in</h2>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" />
              {todayRecord.checkInTime}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4" />
              {formatCoords(todayRecord.latitude, todayRecord.longitude)}
            </p>
            <div
              className={`mt-3 flex items-start gap-2 rounded-2xl px-3 py-2.5 ${
                geofence.zone === null
                  ? 'bg-slate-50 dark:bg-slate-800/80'
                  : outside
                    ? 'bg-rose-50 dark:bg-rose-500/10'
                    : 'bg-emerald-50 dark:bg-emerald-500/10'
              }`}>
              {outside ? (
                <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
              ) : (
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    geofence.zone === null
                      ? 'text-slate-400'
                      : 'text-emerald-600 dark:text-emerald-300'
                  }`}
                />
              )}
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                    geofence.zone === null
                      ? 'text-slate-400'
                      : outside
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                  {geofence.zone === null
                    ? 'Waiting for GPS'
                    : outside
                      ? 'Outside company premises'
                      : 'Inside company premises'}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  {geofence.zone === null
                    ? 'Live location is needed to confirm the boundary.'
                    : outside
                      ? 'You are outside the geofence boundary.'
                      : 'You are inside the geofence boundary.'}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <button
          type="button"
          className="btn-primary mt-5 w-full"
          disabled={!gpsReady || gpsLoading || submitting}
          onClick={onCheckIn}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
          {gpsReady ? 'Check in now' : 'Check-in blocked'}
        </button>
      )}

      <GeofencePanel
        site={geofence.site}
        location={gps?.ok ? gps.location : null}
        gpsMessage={gps && !gps.ok ? gps.message : undefined}
        reading={geofence.reading}
        zone={geofence.zone}
        openEvent={geofence.openEvent}
        lastClosed={geofence.lastClosed}
        todayEvents={geofence.todayEvents}
        secondsOutside={geofence.secondsOutside}
        reasonSaving={geofence.reasonSaving}
        reasonError={geofence.reasonError}
        checkInTime={todayRecord?.checkInTime}
        checkInCreatedAt={todayRecord?.createdAt}
        onSubmitReason={geofence.submitReason}
      />

      {geofence.syncError ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{geofence.syncError}</p>
      ) : null}

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
