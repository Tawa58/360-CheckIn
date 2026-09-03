import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertCircle,
  ClipboardList,
  Inbox,
  KeyRound,
  MapPin,
  ShieldCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import {listEmployees} from '../lib/employees';
import {listAttendance} from '../lib/attendance';
import {listEmployeeMessages} from '../lib/messages';
import type {AttendanceRecord, Employee, EmployeeMessage} from '@shared/types';
import {formatDisplayDate, isExpired, localISODate} from '@shared/dates';

const tones = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
} as const;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [messages, setMessages] = useState<EmployeeMessage[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Overview · CheckIn360';
    Promise.all([listEmployees(), listAttendance(), listEmployeeMessages()])
      .then(([nextEmployees, nextAttendance, nextMessages]) => {
        setEmployees(nextEmployees);
        setAttendance(nextAttendance);
        setMessages(nextMessages);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load reports.');
      })
      .finally(() => setLoading(false));
  }, []);

  const today = localISODate();
  const stats = useMemo(() => {
    const todayRecords = attendance.filter(item => item.checkInDate === today);
    const expiredCodes = employees.filter(item => isExpired(item.codeExpiry));
    const missingToday = employees.filter(
      employee =>
        !todayRecords.some(record => record.employeeUid === employee.authUid),
    );
    return {
      employeeCount: employees.length,
      todayCount: todayRecords.length,
      expiredCodes: expiredCodes.length,
      missingToday: missingToday.length,
      verifiedToday: todayRecords.filter(item => item.locationStatus === 'Verified')
        .length,
      openMessages: messages.filter(item => item.status === 'open').length,
    };
  }, [attendance, employees, messages, today]);

  const cards = [
    {
      label: 'Employees',
      value: stats.employeeCount,
      to: '/employees',
      icon: Users,
      tone: tones.brand,
    },
    {
      label: 'Checked in today',
      value: stats.todayCount,
      to: '/attendance',
      icon: ClipboardList,
      tone: tones.emerald,
    },
    {
      label: 'Verified today',
      value: stats.verifiedToday,
      to: '/attendance',
      icon: ShieldCheck,
      tone: tones.sky,
    },
    {
      label: 'Not checked in',
      value: stats.missingToday,
      to: '/attendance',
      icon: UserRoundX,
      tone: tones.amber,
    },
    {
      label: 'Expired codes',
      value: stats.expiredCodes,
      to: '/employees',
      icon: KeyRound,
      tone: tones.rose,
    },
    {
      label: 'Open reports',
      value: stats.openMessages,
      to: '/messages',
      icon: Inbox,
      tone: tones.amber,
    },
  ];

  const recent = attendance.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Attendance and access-code status for {formatDisplayDate(today)}.
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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({length: 6}).map((_, index) => (
              <div
                key={index}
                className="card h-[116px] animate-pulse bg-white/70 dark:bg-slate-900/70"
              />
            ))
          : cards.map(card => (
              <Link
                key={card.label}
                to={card.to}
                className="card group p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:hover:border-brand-500/40 sm:p-5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-3xl font-bold tabular-nums text-brand-900 dark:text-brand-200">
                  {card.value}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
              </Link>
            ))}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent check-ins
          </h2>
          <Link
            to="/attendance"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
            View all
          </Link>
        </div>

        <div className="card mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {loading ? 'Loading records…' : 'No check-ins recorded yet.'}
              </p>
            </div>
          ) : (
            recent.map(record => (
              <div
                key={record.attendanceId}
                className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {initials(record.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {record.fullName}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {record.department} · {record.checkInTime}
                  </p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    record.locationStatus === 'Verified'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                  }`}>
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{record.locationStatus}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
