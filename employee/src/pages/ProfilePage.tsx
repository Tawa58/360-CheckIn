import {useEffect} from 'react';
import {KeyRound, LogOut} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {Avatar} from '../components/Avatar';
import {daysUntil, formatExpiry, isExpired} from '@shared/dates';

export function ProfilePage() {
  const {employee, logout} = useAuth();

  useEffect(() => {
    document.title = 'Profile · CheckIn360';
  }, []);

  if (!employee) {
    return null;
  }

  const expired = isExpired(employee.codeExpiry);
  const remaining = daysUntil(employee.codeExpiry);

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Profile
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Employee access details for this device.
      </p>

      <section className="card mt-6 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold text-slate-900 dark:text-white">
              {employee.fullName}
            </p>
            <p className="mt-1 text-sm text-slate-500">{employee.department}</p>
          </div>
        </div>
        <dl className="mt-5 space-y-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Employee ID</dt>
            <dd className="mt-1 text-base text-slate-800 dark:text-slate-200">{employee.employeeId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Username</dt>
            <dd className="mt-1 text-base text-slate-800 dark:text-slate-200">{employee.username}</dd>
          </div>
        </dl>
      </section>

      <section className="card mt-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <KeyRound className="h-4 w-4 text-brand-800 dark:text-brand-300" />
            Access code
          </p>
          <span
            className={`badge ${
              expired
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            }`}>
            {expired ? 'Expired' : 'Active'}
          </span>
        </div>
        <p className="mt-4 rounded-2xl bg-slate-50 py-3 text-center text-2xl font-bold tracking-widest text-brand-800 dark:bg-slate-800 dark:text-brand-200">
          {employee.accessCode}
        </p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Expires {formatExpiry(employee.codeExpiry)}
          {expired
            ? '. Ask admin to renew this code.'
            : ` · ${remaining} day${remaining === 1 ? '' : 's'} remaining.`}
        </p>
      </section>

      <button type="button" className="btn-outline mt-8 w-full" onClick={() => logout()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        You will need your access code to sign in again.
      </p>
    </div>
  );
}
