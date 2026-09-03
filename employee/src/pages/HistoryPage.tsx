import {useCallback, useEffect, useState} from 'react';
import {Clock3, Loader2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {getAttendanceHistory} from '../lib/attendance';
import type {AttendanceRecord} from '@shared/types';
import {formatDisplayDate} from '@shared/dates';

export function HistoryPage() {
  const {employee} = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!employee) {
      return;
    }
    setError('');
    setRecords(await getAttendanceHistory(employee.authUid));
  }, [employee]);

  useEffect(() => {
    document.title = 'History · CheckIn360';
    setLoading(true);
    load()
      .catch(() => setError('Unable to load attendance history.'))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        History
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Your verified attendance records.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading history…
        </p>
      ) : records.length === 0 ? (
        <section className="card mt-6 px-5 py-10 text-center">
          <Clock3 className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            No attendance yet
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            After a successful GPS check-in, it will appear here.
          </p>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {records.map(item => (
            <li key={item.attendanceId} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDisplayDate(item.checkInDate)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.checkInTime}</p>
                </div>
                <span
                  className={`badge ${
                    item.locationStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                  }`}>
                  {item.locationStatus}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
