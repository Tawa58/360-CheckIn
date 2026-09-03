import {useEffect, useMemo, useState} from 'react';
import {AlertCircle, Inbox, Loader2} from 'lucide-react';
import {listEmployeeMessages, updateMessageStatus} from '../lib/messages';
import {listEmployees} from '../lib/employees';
import type {Employee, EmployeeMessage, EmployeeMessageKind, EmployeeMessageStatus} from '@shared/types';
import {formatDisplayDate, formatDisplayDateTime} from '@shared/dates';
import {Avatar} from '../components/Avatar';

type Filter = 'all' | EmployeeMessageKind | 'open';

const filters: {id: Filter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'open', label: 'Open'},
  {id: 'absence', label: 'Absence'},
  {id: 'issue', label: 'Issues'},
];

export function MessagesPage() {
  const [messages, setMessages] = useState<EmployeeMessage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState<Filter>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Inbox · CheckIn360';
    Promise.all([listEmployeeMessages(), listEmployees()])
      .then(([nextMessages, nextEmployees]) => {
        setMessages(nextMessages);
        setEmployees(nextEmployees);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load reports.');
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (filter === 'all') {
      return messages;
    }
    if (filter === 'open') {
      return messages.filter(item => item.status === 'open');
    }
    return messages.filter(item => item.kind === filter);
  }, [filter, messages]);

  async function setStatus(message: EmployeeMessage, status: EmployeeMessageStatus) {
    setUpdating(message.messageId);
    setError('');
    try {
      await updateMessageStatus(message.messageId, status);
      setMessages(current =>
        current.map(item =>
          item.messageId === message.messageId ? {...item, status} : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update that report.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Inbox
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Absence notices and system issues sent from the employee app.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              filter === item.id
                ? 'bg-brand-800 text-white dark:bg-brand-600'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
            }`}>
            {item.label}
            {item.id === 'open' ? (
              <span className="ml-1.5 tabular-nums opacity-80">
                {messages.filter(message => message.status === 'open').length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading inbox…
        </p>
      ) : visible.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filter === 'open'
              ? 'No open reports. Employees send absence notices and system issues from the app menu.'
              : 'No reports match this filter.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map(message => (
            <li key={message.messageId} className="card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar
                  name={message.fullName}
                  photoUrl={
                    employees.find(item => item.authUid === message.employeeUid)?.photoUrl
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {message.fullName}
                    </p>
                    <span
                      className={`badge ${
                        message.kind === 'absence'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                      }`}>
                      {message.kind === 'absence' ? 'Absence' : 'System issue'}
                    </span>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {message.department} · {message.employeeId} · {message.category}
                    {message.absenceDate ? ` · away ${formatDisplayDate(message.absenceDate)}` : ''}
                  </p>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{message.details}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Sent {formatDisplayDateTime(message.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {message.status === 'open' ? (
                  <button
                    type="button"
                    disabled={updating === message.messageId}
                    className="btn-outline"
                    onClick={() => setStatus(message, 'seen')}>
                    Mark seen
                  </button>
                ) : null}
                {message.status !== 'resolved' ? (
                  <button
                    type="button"
                    disabled={updating === message.messageId}
                    className="btn-primary"
                    onClick={() => setStatus(message, 'resolved')}>
                    {updating === message.messageId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Mark resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updating === message.messageId}
                    className="btn-outline"
                    onClick={() => setStatus(message, 'open')}>
                    Reopen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({status}: {status: EmployeeMessage['status']}) {
  const styles = {
    open: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    seen: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };
  const labels = {open: 'Open', seen: 'Seen', resolved: 'Resolved'};
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}
