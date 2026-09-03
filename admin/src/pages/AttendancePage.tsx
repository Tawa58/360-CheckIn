import {useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Clock,
  Filter,
  MapPin,
  UserRoundX,
} from 'lucide-react';
import {listAttendance} from '../lib/attendance';
import {listEmployees} from '../lib/employees';
import type {AttendanceRecord, Employee} from '@shared/types';
import {formatDisplayDate, localISODate} from '@shared/dates';

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(localISODate());
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Attendance · CheckIn360';
    Promise.all([listAttendance(), listEmployees()])
      .then(([nextRecords, nextEmployees]) => {
        setRecords(nextRecords);
        setEmployees(nextEmployees);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load attendance.');
      })
      .finally(() => setLoading(false));
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(employees.map(item => item.department))).sort(),
    [employees],
  );

  const filtered = useMemo(
    () =>
      records.filter(record => {
        if (date && record.checkInDate !== date) {
          return false;
        }
        if (department && record.department !== department) {
          return false;
        }
        if (status && record.locationStatus !== status) {
          return false;
        }
        return true;
      }),
    [date, department, records, status],
  );

  const missing = useMemo(() => {
    if (!date) {
      return [];
    }
    const present = new Set(
      records
        .filter(record => record.checkInDate === date)
        .map(record => record.employeeUid),
    );
    return employees.filter(
      employee =>
        (!department || employee.department === department) &&
        !present.has(employee.authUid),
    );
  }, [date, department, employees, records]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          History, daily records, and missing check-ins.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <section className="card mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Filters
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="field-label">Date</span>
            <input
              type="date"
              className="field-input mt-1.5"
              value={date}
              onChange={event => setDate(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Department</span>
            <select
              className="field-input mt-1.5"
              value={department}
              onChange={event => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {departments.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Location status</span>
            <select
              className="field-input mt-1.5"
              value={status}
              onChange={event => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Records</h2>
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {loading ? (
          <div className="mt-3 space-y-3">
            {Array.from({length: 3}).map((_, index) => (
              <div
                key={index}
                className="card h-24 animate-pulse bg-white/70 dark:bg-slate-900/70"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-3 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">No records</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Nothing matches the current filters.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="mt-3 space-y-3 lg:hidden">
              {filtered.map(record => (
                <article key={record.attendanceId} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {record.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {record.employeeId} · {record.department}
                      </p>
                    </div>
                    <StatusBadge status={record.locationStatus} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Date
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
                        {formatDisplayDate(record.checkInDate)}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Time
                      </dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-slate-700 dark:text-slate-200">
                        {record.checkInTime}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                  </p>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="card mt-3 hidden overflow-hidden lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Employee</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                    <th className="px-5 py-3.5 font-semibold">Time</th>
                    <th className="px-5 py-3.5 font-semibold">Location</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(record => (
                    <tr
                      key={record.attendanceId}
                      className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {record.fullName}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {record.employeeId} · {record.department}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {formatDisplayDate(record.checkInDate)}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slate-600 dark:text-slate-300">
                        {record.checkInTime}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={record.locationStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Not checked in
          </h2>
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {missing.length}
          </span>
        </div>
        <div className="card mt-3">
          {missing.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <UserRoundX className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Every matching employee has a record for this date.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {missing.map(employee => (
                <li
                  key={employee.authUid}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <span className="min-w-0 truncate font-medium text-slate-900 dark:text-white">
                    {employee.fullName}
                  </span>
                  <span className="badge shrink-0 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {employee.department}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({status}: {status: AttendanceRecord['locationStatus']}) {
  return (
    <span
      className={`badge shrink-0 ${
        status === 'Verified'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
      }`}>
      <MapPin className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
